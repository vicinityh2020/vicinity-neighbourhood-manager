var mongoose = require('mongoose');
var audits = require('../../services/audit/audit');
var userOp = require('../../models/vicinityManager').user;
var userAccountsOp = require('../../models/vicinityManager').userAccounts;
var logger = require("../../middlewares/logger");
var authHelper = require('../../services/login/login');
var sharingRules = require('../../services/sharingRules');
var sUpdItems = require('../../services/items/update');
var bcrypt = require('bcrypt');

/*
Update a user
*/
function putOne(uid, updates, userMail, userId, callback) {
  if(updates.hasOwnProperty('accessLevel')){
    sharingRules.changeUserAccessLevel(uid, updates.accessLevel, userMail)
    .then(function(response){
      doUpdate(uid, updates, userMail, userId, function(err, response){
        if(err){ callback(true, response); } else { callback(false, response); }
      });
    })
    .catch(function(err){
      callback(true, err);
    });
  } else if(updates.hasOwnProperty('authentication.principalRoles')){
    userOp.findOne({_id: uid}, {hasItems:1, 'authentication.principalRoles':1, cid:1}).populate('hasItems.id', 'typeOfItem').exec(function(err, response){
      if(err){
        logger.debug('err: ' + err);
        callback(true, err);
      } else {
        response = response.toObject();
        var couldServices = updates['authentication.principalRoles'].indexOf('service provider') === -1;
        var couldDevs = updates['authentication.principalRoles'].indexOf('infrastructure operator') === -1;
        var canServices = response.authentication.principalRoles.indexOf('service provider') === -1;
        var canDevs = response.authentication.principalRoles.indexOf('infrastructure operator') === -1;
        var wasAdmin = updates['authentication.principalRoles'].indexOf('administrator') === -1;
        var isAdmin = response.authentication.principalRoles.indexOf('administrator') === -1;
        var canChange = true;

        if(wasAdmin || !isAdmin) canChange = response.oid !== userMail; // Remove admin role only if a diff admin does it

        if(!canChange){
          callback(false, 'At least one admin needed');
        } else if((couldServices && !canServices) || (couldDevs && !canDevs)){
          var items = [];
          getItems(response.hasItems, canDevs, canServices, items);
          sUpdItems.updateManyItems(items, userMail, updates.decoded_token.cid, updates.decoded_token.orgid, uid, function(err, response){
            if(!err){
              doUpdate(uid, updates, userMail, userId, function(err, response){
                if(err){ callback(true, response); } else { callback(false, response); }
              });
            } else {
              callback(true, err);
            }
          });
        } else {
          doUpdate(uid, updates, userMail, userId, function(err, response){
            if(err){ callback(true, response); } else { callback(false, response); }
          });
        }
      }
    });
  } else {
    doUpdate(uid, updates, userMail, userId, function(err, response){
      if(err){ callback(true, response); } else { callback(false, response); }
    });
  }
}

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
    callback(false, updItem); })
  .catch(function(err){
    logger.error({user: userMail, action: 'updateUser', item: uid, message: err });
    callback(true, err);
  });
}

/*
Change the user password
*/
function putPassword(id, oldPwd, newPwd, callback){
  var hash = "";

  userOp.findOne({_id:id},{authentication:1})
  .then(function(response){
    hash = response.authentication.hash;
    return bcrypt.compare(oldPwd, hash); // True if valid pwd
  })
  .then(function(response){
    if(response){
      authHelper.updatePwd(id, newPwd, function(err, response){
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

// Private functions

function getItems(allItems, canDevs, canServices, items){
  for(var i = 0; i < allItems.length; i++){
    if(!canDevs && allItems[i].id.typeOfItem === 'device') items.push({o_id: allItems[i].id._id, oid: allItems[i].extid, status: 'disabled', accessLevel: 0, oldAccessLevel: 2});
    if(!canServices && allItems[i].id.typeOfItem === 'service') items.push({o_id: allItems[i].id._id, oid: allItems[i].extid, status: 'disabled', accessLevel: 0, oldAccessLevel: 2});
  }
}

// Export modules

module.exports.putOne = putOne;
module.exports.putPassword = putPassword;
