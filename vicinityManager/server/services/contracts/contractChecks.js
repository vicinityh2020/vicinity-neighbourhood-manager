// Security and authenticity checks for the contracts module

// Global objects and variables
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../services/audit/audit');
var contractOp = require('../../models/vicinityManager').contract;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var ctChecks = require("../../services/contracts/contractChecks.js");
var ctHelper = require("../../services/contracts/contracts.js");
var sync = require('../../services/asyncHandler/sync');

// Public functions

/*
Check post contract validity
*/
function postCheck(data, roles, cid, callback){
  var result, resultUid, resultCid; // Boolean; return true if all the conditions meet
  var items = [];

// Check that IoTOwner matches with the user doing the contract request
  imIotOperator = roles.indexOf('infrastructure operator') !== -1;
  sameCompany = cid.toString() === data.cidDevice.id.toString();
  result = imIotOperator && sameCompany;

  if(result){
    getOnlyProp(items, data.oidsDevice, 'id');
    getOnlyProp(items, data.oidsService, 'id');

    checkVisibility(items, cid, data.cidService.id)
    .then(function(response){
      if(response){ callback(false, 'authorized', true); }
      else { callback(false, 'Some items cannot be shared', false); }
    })
    .catch(function(error){
      callback(true, error, false);
    });

    // Check that the items are not simultaneously controlled by more than one service
    // TODO after discussing with partners requirements!!

  } else {
    callback(false, 'Contract requester must be the IoT Owner', false);
  }
}

/*
Check delete contract validity
*/
function deleteCheck(ctid, uid, cid, callback){
  imContractingParty(ctid, uid)
  .then(function(response){
    if(response){ callback(false, 'Authorized', true); }
    else { callback(false, 'Unauthorized', false); }
  })
  .catch(function(error){
    callback(true, error, false);
  });
}

/*
Check accept contract validity
*/
function acceptCheck(ctid, uid, cid, callback){
  iHaveToApproveContract(ctid, uid)
  .then(function(response){
    if(response){ callback(false, 'Authorized', true); }
    else { callback(false, 'Unauthorized', false); }
  })
  .catch(function(error){
    callback(true, error, false);
  });
}

/*
Checks if a user can be pulled from a contract
Is the case of user is no contract admin and has no items in it
*/
function checkContracts(userId, userMail){
  return new Promise(function(resolve, reject) {
    var user_id =  mongoose.Types.ObjectId(userId);
    var ctids_notAdmin = [];
    userOp.findOne({_id: user_id}, {hasContracts:1} )
    .then(function(response){
      // Get only the contracts of which the user is not ADMIN
        getOnlyIdCondition(ctids_notAdmin, response.hasContracts);
        removeUserFromContract(ctids_notAdmin, user_id, userMail);
    })
    .then(function(response){
      resolve(true);
    })
    .catch(function(err){
      reject(err);
    });
  });
}


/*
Checks if a contract has to be removed
Case one party has no items in it
// TODO get the users of the contracts to remove to notify them
*/
function contractValidity(ctids, uid, mail){
  logger.debug("DEBUG: removing contracts that have no items...");
  var toRemoveCtid = [];
  var toRemoveId = [];
  var ownUsers = [];
  var foreignUsers = [];
  return new Promise(function(resolve, reject) {
    contractOp.find(
      {"ctid": {$in: ctids},
      $or: [ {"foreignIot.items": { $exists: true, $size: 0 } },
            {"iotOwner.items": { $exists: true, $size: 0 } } ]
      }, {ctid: 1, 'foreignIot.users': 1, 'iotOwner.users': 1})
    .then(function(data){
      logger.debug("DEBUG: Contracts to remove... " + data);
      getOnlyProp(toRemoveCtid, data, 'ctid');
      getOnlyProp(toRemoveId, data, '_id');
      getOnlyProp(foreignUsers, data, 'foreignIot.users');
      getOnlyProp(ownUsers, data, 'iotOwner.users');
      var newCt = {
        foreignIot: {},
        iotOwner: {},
        legalDescription: "",
        status: 'deleted'};
      return contractOp.update({"ctid": {$in: toRemoveCtid}}, {$set: newCt}, {multi: true});
    })
    .then(function(data){
      var notifications = [];
      for(var i = 0, l = toRemoveCtid.length; i < l; i++ ){
        notifications.push(ctHelper.createNotifAndAudit(toRemoveId[i], toRemoveCtid[i], uid, mail, ownUsers[i], foreignUsers[i], true, 'DELETE'));
      }
      return Promise.all(notifications);
    })
    .then(function(data){
      resolve(true);
    })
    .catch(function(err){
      logger.debug(err);
      reject(false);
    });
  });
}

// Private functions

function removeUserFromContract(ctids, uid, mail){
  return new Promise(function(resolve, reject) {
    if(ctids.length > 0){ // Check if there is any contracts to check
      sync.forEachAll(ctids,
        function(value, allresult, next, otherParams) {
          var ctid = mongoose.Types.ObjectId(value);
          itemsOp.find({'uid.id': uid, 'hasContracts.id': ctid}, {oid: 1})
          .then(function(data){
            if(data){
              // If there are devices still, do not pull the user from the contract
              return new Promise(function(resolve, reject) { reject(true); });
            } else {
              return contractOp.update({"_id": ctid}, {$pull: {"iotOwner.uid": {id: uid}} });
            }
          })
          .then(function(response){
            allresult.push(true);
            next();
          })
          .catch(function(err){
            allresult.push(true);
            next();
          });
        },
        function(allresult) {
          if(allresult.length === ctids.length){
            resolve(true);
          }
        },
        false,
        {}
      );
    } else {
      resolve(false);
    }
  });
}

/*
Check that I am part of the contract
*/
function imContractingParty(ctid, uid){
  return new Promise(function(resolve, reject) {
    userOp.findOne({_id: uid, 'hasContracts.id': ctid}, {hasContracts:1})
    .then(function(response){
      if(response){ resolve(true); } else { resolve(false); }
    })
    .catch(function(error){
      logger.debug(error);
      reject(error);
    });
  });
}

/*
Check that I am a contracting party and the contract awaits my approval
*/
function iHaveToApproveContract(ctid, uid){
  return new Promise(function(resolve, reject) {
    userOp.findOne({_id: uid, 'hasContracts.id': ctid, 'hasContracts.approved': false}, {hasContracts:1})
    .then(function(response){
      if(response){ resolve(true); } else { resolve(false); }
    })
    .catch(function(error){
      logger.debug(error);
      reject(error);
    });
  });
}

/*
Check that items visibility allows contracting party to see otherParams
*/
function checkVisibility(items, cidIot, cidService){
  var friends = false; // Organisations are friends
  var canContinue = true; // Contract can be signed
  var knows = [];
  return new Promise(function(resolve, reject) {
    userAccountOp.findOne({_id:cidIot},{knows:1})
    .then(function(response){
      getOnlyProp(knows, response.knows, 'id');
      for(var i = 0; i < knows.length; i++){
        if(cidService.toString() === knows[i].toString()){ friends = true; }
      }
      return itemOp.find({_id: {$in: items}},{'accessLevel':1});
    })
    .then(function(response){
      if(friends){
        for(var i = 0; i < response.length; i++){
          if(response[i].accessLevel === 0){ canContinue = false; }
        }
      } else {
        for(var j = 0; j < response.length; j++){
          if(response[j].accessLevel <= 1){ canContinue = false; }
        }
      }
      resolve(canContinue);
    })
    .catch(function(error){
      logger.debug(error);
      reject(error);
    });
  });
}

/*
Extract one field per object in array
Output: array of strings
*/
function getOnlyProp(items, toAdd, property){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i][property]);
  }
}

function getOnlyIdCondition(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    if(!toAdd[i].imAdmin){
      items.push(toAdd[i].id);
    }
  }
}

// modules exports

module.exports.postCheck = postCheck;
module.exports.deleteCheck = deleteCheck;
module.exports.acceptCheck = acceptCheck;
module.exports.checkContracts = checkContracts;
