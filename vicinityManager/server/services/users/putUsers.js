var mongoose = require('mongoose');
var audits = require('../../services/audit/audit');
var userOp = require('../../models/vicinityManager').user;
var userAccountsOp = require('../../models/vicinityManager').userAccounts;
var logger = require("../../middlewares/logger");
var authHelper = require('../../services/login/login');
var sharingRules = require('../../services/sharingRules');
var sUpdItems = require('../../services/items/update');
var bcrypt = require('bcrypt');

//Public function

/*
Select type of update
*/
function putOne(uid, updates, userMail, userId, type, callback) {
  if(updates.hasOwnProperty('accessLevel') && type === "visibility"){
    putVisibility(uid, updates, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else if(updates.hasOwnProperty('roles') && type === "roles"){
    putRoles(uid, updates, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else if(updates.hasOwnProperty('newPwd') && type === "password"){
    putPassword(uid, updates, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else if(type === "metadata"){
    putMetadata(uid, updates, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else {
    callback(false, "Missing or wrong information, not possible to update...", false);
  }
}


// Private functions

/*
Change the user visibility
*/
function putVisibility(uid, updates, userMail, userId, callback) {
  var data = {"accessLevel": updates.accessLevel}; //Ensure only right fields sent to update
  sharingRules.changeUserAccessLevel(uid, updates.accessLevel, userMail)
  .then(function(response){
    doUpdate(uid, data, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  })
  .catch(function(err){
    callback(true, err, false);
  });
}

/*
Change the user Roles
*/
function putRoles(uid, updates, userMail, userId, callback) {
  var data = {"authentication.principalRoles": updates.roles}; //Ensure only right fields sent to update
  userOp.findOne({_id: uid}, {hasItems:1, 'authentication.principalRoles':1, cid:1}).populate('hasItems.id', 'typeOfItem').exec(function(err, response){
    if(err){
      logger.debug('err: ' + err);
      callback(true, err, false);
    } else {
      response = response.toObject();
      var couldServices = updates.roles.indexOf('service provider') === -1;
      var couldDevs = updates.roles.indexOf('infrastructure operator') === -1;
      var canServices = response.authentication.principalRoles.indexOf('service provider') === -1;
      var canDevs = response.authentication.principalRoles.indexOf('infrastructure operator') === -1;
      var wasAdmin = updates.roles.indexOf('administrator') === -1;
      var isAdmin = response.authentication.principalRoles.indexOf('administrator') === -1;
      var canChange = true;

      if(wasAdmin || !isAdmin) canChange = response.oid !== userMail; // Remove admin role only if a diff admin does it

      if(!canChange){
        callback(false, 'At least one admin needed', false);
      } else if((couldServices && !canServices) || (couldDevs && !canDevs)){
        var items = [];
        getItems(response.hasItems, canDevs, canServices, items);
        sUpdItems.updateManyItems(items, userMail, updates.decoded_token.cid, updates.decoded_token.orgid, uid, function(err, response){
          if(!err){
            doUpdate(uid, data, userMail, userId, function(err, response, success){
              if(err){ callback(true, err, success); } else { callback(false, response, success); }
            });
          } else {
            callback(true, err, false);
          }
        });
      } else {
        doUpdate(uid, data, userMail, userId, function(err, response, success){
          if(err){ callback(true, err, success); } else { callback(false, response, success); }
        });
      }
    }
  });
}

/*
Change the user Metadata
*/
function putMetadata(uid, updates, userMail, userId, callback) {
  var data = {};
  var updCount = 0;
  if(updates.hasOwnProperty('occupation')) {
    data.occupation = updates.occupation;
    updCount += 1;
  }
  if(updates.hasOwnProperty('name')) {
    data.name = updates.name;
    updCount += 1;
  }
  if(updates.hasOwnProperty('avatar')) {
    data.avatar = updates.avatar;
    updCount += 1;
  }
  if(updCount > 0){
    doUpdate(uid, data, userMail, userId, function(err, response, success){
      if(err){ callback(true, err, success); } else { callback(false, response, success); }
    });
  } else {
    callback(false, "Missing or wrong information, not possible to update...", false);
  }
}

/*
Change the user password
*/
function putPassword(uid, updates, userMail, userId, callback){
  var hash = "";
  var oldPwd = updates.oldPwd;
  var newPwd = updates.newPwd;
  userOp.findOne({_id:uid},{authentication:1})
  .then(function(response){
    hash = response.authentication.hash;
    return bcrypt.compare(oldPwd, hash); // True if valid pwd
  })
  .then(function(response){
    if(response){
      authHelper.updatePwd(uid, newPwd, function(err, response){
        logger.audit({user: userMail, action: 'updatePassword', item: uid });
        callback(false, response, true);
      });
    } else {
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
function doUpdate(uid, updates, userMail, userId, callback){
  var updItem;
  userOp.findOneAndUpdate( { "_id": uid}, {$set: updates}, {new: true})
  .then(function(response){
    updItem = response;
    return audits.create(
      { kind: 'user', item: userId , extid: userMail },
      { kind: 'userAccount', item: response.cid.id, extid: response.cid.extid },
      { kind: 'user', item: response._id, extid: response.email },
      13, null);
  })
  .then(function(response){
    logger.audit({user: userMail, action: 'updateUser', item: uid });
    callback(false, updItem, true); })
  .catch(function(err){
    logger.error({user: userMail, action: 'updateUser', item: uid, message: err });
    callback(true, err, false);
  });
}

/*
Aux function
Selects type of item to be removed based on new user Roles
Can be both, one or none
*/
function getItems(allItems, canDevs, canServices, items){
  for(var i = 0; i < allItems.length; i++){
    if(!canDevs && allItems[i].id.typeOfItem === 'device') items.push({o_id: allItems[i].id._id, oid: allItems[i].extid, status: 'disabled', accessLevel: 0, oldAccessLevel: 2});
    if(!canServices && allItems[i].id.typeOfItem === 'service') items.push({o_id: allItems[i].id._id, oid: allItems[i].extid, status: 'disabled', accessLevel: 0, oldAccessLevel: 2});
  }
}

// Export modules
module.exports.putOne = putOne;
