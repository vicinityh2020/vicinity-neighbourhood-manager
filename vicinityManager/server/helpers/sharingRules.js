// Global objects and variables ================================

var mongoose = require('mongoose');
var itemOp = require('../models/vicinityManager').item;
var userAccountOp = require('../models/vicinityManager').userAccount;
var contractOp = require('../models/vicinityManager').contract;
var logger = require("../middlewares/logger");
var notificationAPI = require('../routes/notifications/notifications');
var sync = require('../helpers/asyncHandler/sync');
var commServer = require('../helpers/commServer/request');
var ctHelper = require('../helpers/contracts/contracts');
var audits = require('../routes/audit/put');

// Public functions ================================

/*
An organisation stops being my partner
I need to remove my devices with friend data access Level
To do so, I remove the group which shares with my friend and the group which
my friend is using to share with me.
*/
function removeFriend(my_id, friend_id){
  logger.debug('removing friend');
  var items1, items2, items;

  itemOp.find({'cid.id':my_id, accessLevel: {$lt: 2}, 'hasContracts.contractingParty':friend_id}, {hasContracts:1, oid:1, cid:1, accessLevel:1, typeOfItem:1}).populate('cid.id', 'knows')
  .then(function(response){
    if(response){ items1 = response; }
    return itemOp.find({'cid.id':friend_id, accessLevel: {$lt: 2}, 'hasContracts.contractingParty':my_id}, {hasContracts:1, oid:1, cid:1, accessLevel:1, typeOfItem:1}).populate('cid.id', 'knows');
  })
  .then(function(response){
    if(response){ items2 = response; }
    return new Promise(function(resolve, reject) {
      items = items1.concat(items2);

      if(items.length !== 0){ // Check if there is any item to delete
        logger.debug('Start async handler...');
        sync.forEachAll(items,
          function(value, allresult, next) {
            ctHelper.removeDevice(value, function(value, result) {
                allresult.push({value: value, error: result});
                next();
            });
          },
          function(allresult) {
            if(allresult.length === items.length){
              logger.debug('Completed async handler: ' + JSON.stringify(allresult));
              resolve({"error": false, "message": allresult });
            }
          },
          false
        );
      } else {
        logger.debug('Unfriending: No items to delete');
        // logger.warn({user:email, action: 'removeContract', message: "Nothing to be removed"});
        resolve({"error": false, "message": "Nothing to be removed..."});
      }
    });
  })
  .then(function(response){
    return {error: false, message: response}; // response is already and object {error,message}
  })
  .catch(function(error){
    logger.debug('Error remove friend: ' + error);
    return {error: true, message: error};
  });
}

/*
A device changes its accessLevel
I need to remove/add from/to the commServer groups accordingly
*/
function changePrivacy(updates){
  var oldStatus = Number(updates.oldAccessLevel);
  var newStatus = Number(updates.accessLevel);
  return new Promise(
    function(resolve, reject) {
    logger.debug(oldStatus + ' to ' + newStatus);
    findCase(oldStatus, newStatus, updates, function(error, result){
      logger.debug('END change accessLevel');
      logger.debug('Error: ' + error + ', Result: ' + result);
      resolve({error: error, result:result});
    });
  });
}

/*
Start contract group in commServer
*/
function createContract(id, descr){
  var payload = {
    name: id,
    description: descr
  };
  return commServer.callCommServer(payload, 'groups', 'POST');
}

/*
Add items to the contract
*/
function addItemsToContract(other, items){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      // logger.debug('Start async handler...');
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          adding(value, otherParams, function(value, result) {
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === items.length){
            logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {ctid: other.ctid, id: other._id, mail: other.serviceProvider.uid.extid, orgOrigin: other.iotOwner.cid, OrgDest: other.serviceProvider.cid}
      );
    } else {
      logger.warn({user:mail, action: 'addItemToContract', message: "No items to be added"});
      resolve({"error": false, "message": "Nothing to be removed..."});
    }
  });
}

/*
Remove contract group in commServer
*/
function cancelContract(id){
  return commServer.callCommServer({}, 'groups/' + id, 'DELETE')
  .catch(function(err){
    return new Promise(function(resolve, reject) {
      if(err.statusCode !== 404){
        reject('Error in commServer: ' + err);
      } else {
        resolve(true);
      }
    });
  });
}

// Private functions ================================

/*
Find how to resolve the accessLevel change in the device
Based on old and new accessLevel captions
*/
function findCase(oldA, newA, updates, callback){
  var id = updates.id;
  var item = {};
  if((oldA === 2 && newA === 1) || (oldA === 2 && newA === 0) || (oldA === 1 && newA === 0)) {
    itemOp.findOne({_id: id},{hasContracts:1, oid:1, cid:1, accessLevel:1, typeOfItem:1}).populate('cid.id', 'knows')
    .then( function(response){
      item = response.toObject();
      item.accessLevel = newA;
      return ctHelper.removeDevice(item, function(value, result){
        callback(false, result);
      });
    })
    .catch(function(err){
      logger.debug(err);
      callback(true, err);
    });
  } else {
    logger.debug("No action required!");
    callback(false, 'Nothing');
  }
}

/*
Add items to contract group in commServer
*/
function adding(oid, otherParams, callback){
  // logger.debug('START execution with value =', oid);
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.ctid , 'POST')
  // .then(function(response){
  //   var id = null;
  //   for(var i = 0; i < otherParams.iotOwner.items.length;){
  //     if(otherParams.iotOwner.items[i].extid === oid){id = otherParams.iotOwner.items[i].id;}
  //   }
  //   if(id === null){
  //     new Promise(function(resolve, reject) { resolve(true); } );
  //   } else {
  //     return audits.putAuditInt(
  //       id,
  //       { orgOrigin: otherParams.orgDest,
  //         orgDest:otherParams.orgOrigin,
  //         auxConnection: {kind: 'contract', item: otherParams.id, extid: otherParams.ctid},
  //         eventType: 51 }
  //     );
  //   }
  // })
  .then(function(ans){
    logger.audit({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid });
    callback(oid, "Success");})
  .catch(function(err){
      logger.error({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid, message: err });
      callback(oid, 'Error: ' + err);
  });
}

// Function exports ================================

module.exports.removeFriend = removeFriend;
module.exports.changePrivacy = changePrivacy;
module.exports.createContract = createContract;
module.exports.cancelContract = cancelContract;
module.exports.addItemsToContract = addItemsToContract;
