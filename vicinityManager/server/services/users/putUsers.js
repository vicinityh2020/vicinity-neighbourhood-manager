var mongoose = require('mongoose');
var audits = require('../../services/audit/audit');
var userOp = require('../../models/vicinityManager').user;
var userAccountsOp = require('../../models/vicinityManager').userAccounts;
var logger = require("../../middlewares/logBuilder");
var lo = require("../../middlewares/logger");

var authHelper = require('../../services/login/login');
var sharingRules = require('../../services/sharingRules');
var bcrypt = require('bcrypt');

//Public function

/**
 * Select type of update
 *
 * @param {Object} obj
 * uid, updates, userMail, userId, type, req, res
 * @return {Object} callback
 */
function putOne(obj, callback) {

  if(obj.updates.hasOwnProperty('accessLevel') && obj.type === "visibility"){
    putVisibility(obj, function(err, response, success){
      if(err){ callback(true, response, success); } else { callback(false, response, success); }
    });
  } else if(obj.updates.hasOwnProperty('roles') && obj.type === "roles"){
      putRoles(obj, function(err, response, success){
        if(err){ callback(true, response, success); } else { callback(false, response, success); }
      });
  } else if(obj.updates.hasOwnProperty('newPwd') && obj.type === "password"){
    putPassword(obj, function(err, response, success){
      if(err){ callback(true, response, success); } else { callback(false, response, success); }
    });
  } else if(obj.type === "metadata"){
    putMetadata(obj, function(err, response, success){
      if(err){ callback(true, response, success); } else { callback(false, response, success); }
    });
  } else {
    callback(false, "Missing or wrong information, not possible to update...", false);
  }
}


// Private functions

/*
Change the user visibility
*/
function putVisibility(obj, callback) {
  var data = {"accessLevel": obj.updates.accessLevel}; //Ensure only right fields sent to update
  if(Number(obj.updates.accessLevel) < 0 || Number(obj.updates.accessLevel) > 2){
    logger.log(obj.req, obj.res, {type: 'warn', data: 'Insuficient accessLevel'});
    callback(false, "Wrong accessLevel. Valid are [0, 1, 2]", false);
  } else {
    sharingRules.changeUserAccessLevel(obj)
    .then(function(response){
      // Update updates object with the right path and data after whole verification
      obj.updates = data;
      obj.auditType = 15;
      doUpdate(obj, function(err, response, success){
        if(err){ callback(true, response, success); } else { callback(false, response, success); }
      });
    })
    .catch(function(err){
      callback(true, err, false);
    });
  }
}

/*
Change the user Roles
*/
function putRoles(obj, callback) {
  var data = {}; // Initialize variable to hold actual updates
  userOp.findOne({_id: obj.uid}, {hasItems:1, hasContracts:1, 'authentication.principalRoles':1, cid:1, email:1})
  .populate('hasItems.id', 'typeOfItem')
  .exec(function(err, response){
    if(err){
      callback(true, err, false);
    } else {
      responseParsed = response.toObject();
      var cid = responseParsed.cid;
      var ownerMail = responseParsed.email;
      var things = {};
      things.contracts = (responseParsed.hasContracts.length > 0);
      things.devices = findType(responseParsed.hasItems, 'device');
      things.services = findType(responseParsed.hasItems, 'service');
      // Forbidden user roles (only web admin)
      var indexDevOps = obj.updates.roles.indexOf('devOps');
      if(indexDevOps !== -1) obj.updates.roles.splice(indexDevOps, 1);
      var indexSU = obj.updates.roles.indexOf('superUser');
      if(indexSU !== -1) obj.updates.roles.splice(indexSU, 1);
      // Complete update payload -- Check if something is missing
      if(responseParsed.authentication.principalRoles.indexOf('devOps') !== -1){
        obj.updates.roles.push('devOps'); // If it is devOps keep status
      }
      if(responseParsed.authentication.principalRoles.indexOf('superUser') !== -1){
        obj.updates.roles.push('superUser'); // If it is superUser keep status
      }
      if(obj.updates.roles.indexOf('user') === -1){
        obj.updates.roles.push('user'); // User has to be always a role
      }
      var data = {"authentication.principalRoles": obj.updates.roles}; //Ensure only right fields sent to update

      // Check update suitability, stop process if necessary with right warning
      var canServices = obj.updates.roles.indexOf('service provider') !== -1;
      var canDevs = obj.updates.roles.indexOf('device owner') !== -1;
      var canContracts = obj.updates.roles.indexOf('infrastructure operator') !== -1;
      var couldServices = responseParsed.authentication.principalRoles.indexOf('service provider') !== -1;
      var couldDevs = responseParsed.authentication.principalRoles.indexOf('device owner') !== -1;
      var couldContracts = responseParsed.authentication.principalRoles.indexOf('infrastructure operator') !== -1;
      var stopServices = (couldServices && !canServices && things.services); // Losing service provider role and still having services
      var stopDevices = (couldDevs && !canDevs && things.devices); // Losing device owner role and still having devices
      var stopContracts = (couldContracts && !canContracts && things.contracts); // Losing infrastructure operator role and still having contracts
      var willAdmin = obj.updates.roles.indexOf('administrator') !== -1;
      var isAdmin = responseParsed.authentication.principalRoles.indexOf('administrator') !== -1;
      var canChange = true;

      if(willAdmin !== isAdmin){ canChange = ownerMail !== obj.userMail; } // Only a different admin can modify my admin role

      var invalidRoles = checkRoles(obj.updates.roles);

      if(!canChange){
        logger.log(obj.req, obj.res, {type: 'warn', data: 'Only a different administrator can modify your administrator role' });
        callback(false, 'Only a different administrator can modify your administrator role', false);
      } else if(invalidRoles.invalid){
        logger.log(obj.req, obj.res, {type: 'warn', data: invalidRoles.message + ' is an invalid role' });
        callback(false, invalidRoles.message + ' is an invalid role...', false);
      } else if( stopServices || stopDevices || stopContracts ){
        var msg = "User cannot change roles, please remove its:";
        if(stopDevices) msg = msg + " devices";
        if(stopServices) msg = msg + " services";
        if(stopContracts) msg = msg + " contracts";
        callback(false, msg, false);
      } else {
        // Update updates object with the right path and data after whole verification
        obj.updates = data;
        obj.auditType = 13;
        doUpdate(obj, function(err, response, success){
          if(err){ callback(true, response, success);
          } else {
            callback(false, response, success);
          }
        });
      }
    }
  });
}

/*
Change the user Metadata
*/
function putMetadata(obj, callback) {
  var data = {};
  var updCount = 0;
  if(obj.updates.hasOwnProperty('occupation')) {
    data.occupation = obj.updates.occupation;
    updCount += 1;
  }
  if(obj.updates.hasOwnProperty('name')) {
    data.name = obj.updates.name;
    updCount += 1;
  }
  if(obj.updates.hasOwnProperty('avatar')) {
    data.avatar = obj.updates.avatar;
    updCount += 1;
  }
  if(obj.updates.hasOwnProperty('contactMail')) {
    data.contactMail = obj.updates.contactMail;
    updCount += 1;
  }
  if(updCount > 0){
    // Update updates object with the right path and data after whole verification
    obj.updates = data;
    obj.auditType = 14;
    doUpdate(obj, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else {
    logger.log(obj.req, obj.res, {type: 'warn', data: "Missing or wrong information, not possible to update"});
    callback(false, "Missing or wrong information, not possible to update...", false);
  }
}

/*
Change the user password
*/
function putPassword(obj, callback){
  var hash = "";
  var oldPwd = obj.updates.oldPwd;
  var newPwd = obj.updates.newPwd;
  userOp.findOne({_id: obj.uid},{authentication:1})
  .then(function(response){
    hash = response.authentication.hash;
    return bcrypt.compare(oldPwd, hash); // True if valid pwd
  })
  .then(function(response){
    if(response){
      authHelper.updatePwd(obj.uid, newPwd, function(err, response){
        if(err) callback(true, response, false);
        logger.log(obj.req, obj.res, {type: 'audit', data: {user: obj.userMail, action: 'updatePassword', item: obj.uid }});
        callback(false, response, true);
      });
    } else {
      logger.log(obj.req, obj.res, {type: 'warn', data: 'Wrong password'});
      callback(false, "Wrong password", false);
    }
  })
  .catch(function(err){
    callback(true, err, false);
  });
}

/*
Actual NM storage update
*/
function doUpdate(obj, callback){
  var updItem;
  // logger.log(obj.req, obj.res, {type: 'debug', data: obj.updates });
  userOp.findOneAndUpdate( { "_id": obj.uid}, {$set: obj.updates}, {new: true})
  .then(function(response){
    updItem = response;
    return audits.create(
      { kind: 'user', item: obj.userId , extid: obj.userMail },
      { kind: 'userAccount', item: response.cid.id, extid: response.cid.extid },
      { kind: 'user', item: response._id, extid: response.email },
      obj.auditType, null);
  })
  .then(function(response){
    logger.log(obj.req, obj.res, {type: 'audit', data: {user: obj.userMail, action: 'updateUser', uid: obj.uid }});
    callback(false, updItem, true);
  })
  .catch(function(err){
    callback(true, err, false);
  });
}

/*
Check if there are devices and/or services
*/
function findType(items, type){
  for(var i = 0, l = items.length; i < l; i++){
    if(items[i].id && items[i].id.typeOfItem === type){
      return true;
    }
  }
  return false;
}

/*
Validates Roles
If role does not exist throw error message
*/
function checkRoles(roles){
  var possibleRoles =  ["service provider", "device owner", "infrastructure operator", "administrator", "system integrator", "devOps", "user", "superUser"];
  for(var i = 0, l = roles.length; i < l; i++){
    if(possibleRoles.indexOf(roles[i]) === -1){
      return {invalid: true, message: roles[i]};
    }
  }
  return {invalid: false, message: null};
}

// Export modules
module.exports.putOne = putOne;
