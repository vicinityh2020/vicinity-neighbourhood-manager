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
function postCheck(data, uid, cid, callback){
  var result, resultUid, resultCid; // Boolean; return true if all the conditions meet
  var items = [];

// Check that IoTOwner is matches with the user doing the contract request
  resultUid = uid.toString() === data.uidDevice.id.toString();
  resultCid = cid.toString() === data.cidDevice.id.toString();
  result = resultUid && resultCid;

  if(result){
    getOnlyId(items, data.oidDevices);
    getOnlyId(items, data.oidService);

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
Check update contract validity
*/
function updateCheck(ctid, data, uid, cid, callback){
  var result, resultUid, resultCid; // Boolean; return true if all the conditions meet
  var items = [];

// Check that IoTOwner is matches with the user doing the contract request
  resultUid = uid.toString() === data.uidDevice.id.toString();
  resultCid = cid.toString() === data.cidDevice.id.toString();
  result = resultUid && resultCid;

  if(result){
    getOnlyId(items, data.oidDevices);
    getOnlyId(items, data.oidService);

    checkVisibility(items, cid, data.cidService.id)
    .then(function(response){
      if(response){ return previousOwners(ctid, data); }
      else { return false; }
    })
    .then(function(response){
      if(response){ callback(false, 'authorized', true); }
      else { callback(false, 'Some items cannot be shared or owner mismatch', false); }
    })
    .catch(function(error){
      callback(true, error, false);
    });

    // Check that the items are not simultaneously controlled by more than one service
    // TODO after discussing with partners requirements!!

  } else {
    callback(false, 'Contract updater must be the IoT Owner', false);
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
Modify contracts that need to remove items
Check if the contracts need to be removed or just updated
*/
function checkContracts(ids, userId, userMail){
  var cont = 0;
  return new Promise(function(resolve, reject) {
    if(ids.length !== 0){
      sync.forEachAll(ids,
        function(value, allresult, next, otherParams) {
          checkingContract(value, otherParams, function(error, ctid) {
            allresult.push({error: error, ctid: ctid});
            cont++;
            next();
          });
        },
        function(allresult) {
          if(cont === ids.length){
            resolve('success');
          }
        },
        false,
        {userId: userId, userMail: userMail}
      );
    } else {
      resolve('No contracts to modify');
    }
  });
}

// Private functions

/*
Send each contract to delete or to modify
*/
function checkingContract(ctid, otherParams, callback){
  contractOp.findOne({_id: ctid, status: {$ne: 'deleted'}}, {'serviceProvider.items':1, 'iotOwner.items':1})
  .then(function(response){
    if(!response){
      // TODO Notify/audit update contract
      logger.debug("Contract already deleted...");
      callback(false, ctid);
    }else{
      logger.debug(JSON.stringify(response));
      var hasNoItems = response.serviceProvider.items.length * response.iotOwner.items.length === 0;
      logger.debug(response.serviceProvider.items.length + '  ' + response.iotOwner.items.length );
      if(hasNoItems){
        logger.debug('remove contract total');
        ctHelper.removing(ctid, function(err,response){
          if(err){
            callback(true, ctid);
          } else {
            callback(false, ctid);
          }
        });
      } else {
        // TODO Notify/audit update contract
        callback(false, ctid);
      }
    }
  })
  .catch(function(err){
    logger.debug('Error checking contract validity: ' + err);
    callback(true, ctid);
  });
}


/*
Check that previous owners and service match with the data provided
*/
function previousOwners(ctid, data){
  var flag1, flag2, flag3;
  return new Promise(function(resolve, reject) {
    contractOp.findOne({_id: ctid})
    .then(function(response){
      if(response){
       flag1 = response.iotOwner.uid.id.toString() === data.uidDevice.id.toString();
       flag2 = response.serviceProvider.uid.id.toString() === data.uidService.id.toString();
       flag3 = response.serviceProvider.items[0].id.toString() === data.oidService[0].id.toString();
        if(flag1 && flag2 && flag3){
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    })
    .catch(function(error){
      logger.debug(error);
      reject(error);
    });
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
      getOnlyId(knows, response.knows);
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
function getOnlyId(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i].id);
  }
}

// modules exports

module.exports.postCheck = postCheck;
module.exports.updateCheck = updateCheck;
module.exports.deleteCheck = deleteCheck;
module.exports.acceptCheck = acceptCheck;
module.exports.checkContracts = checkContracts;
