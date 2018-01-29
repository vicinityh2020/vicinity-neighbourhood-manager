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
  var ctids = [];
  itemOp.find({'cid.id':my_id, accessLevel: {$lt: 2}, 'hasContracts.contractingParty':friend_id}, {'hasContracts.id':1})
  .then(function(response){
    for(var i=0; i<response.hasContracts.length; i++){ ctids.push(response.hasContracts[i].id); }
    return itemOp.find({'cid.id':friend_id, accessLevel: {$lt: 2}, 'hasContracts.contractingParty':my_id}, {'hasContracts.id':1});
  })
  .then(function(response){
    for(var i=0; i<response.hasContracts.length; i++){ ctids.push(response.hasContracts[i].id); }
    return new Promise(function(resolve, reject) {
      if(ctids.length > 0){ // Check if there is any item to delete
        logger.debug('Start async handler...');
        sync.forEachAll(ctids,
          function(value, allresult, next) {
            ctHelper.removing(value, function(value, result) {
                logger.debug('END execution with value =', value, 'and error =', result);
                allresult.push({value: value, error: result});
                next();
            });
          },
          function(allresult) {
            if(allresult.length === ctids.length){
              logger.debug('Completed async handler: ' + JSON.stringify(allresult));
              resolve({"error": false, "message": allresult });
            }
          },
          false
        );
      } else {
        // logger.warn({user:email, action: 'removeContract', message: "Nothing to be removed"});
        resolve({"error": false, "message": "Nothing to be removed..."});
      }
    });
  })
  .then(function(response){
    return response; // response is already and object {error,message}
  })
  .catch(function(error){
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
  logger.debug(oldStatus + ' to ' + newStatus);
  findCase(oldStatus, newStatus, updates); // TODO Capture and process possible errors generated in this function
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
function findCase(oldA, newA, updates){
  var friends = updates.myFriends; // _ids
  var oid = updates.oid.id;
  var ctids = [];
  if(oldA === 2 && newA === 1) {
    processAccessLevelChange(oid,friends,ctids);
    // Notify and audit

  } else if(oldA === 2 && newA === 0) {
    processAccessLevelChange(oid,[],ctids); // Does not depend on the friends
    // Notify and audit

  } else if(oldA === 1 && newA === 0) {
    processAccessLevelChange(oid,[],ctids); // Does not depend on the friends
    // Notify and audit

  } else {
    logger.debug("No action required!");
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

/*
Process change of the access level
*/

function processAccessLevelChange(oid, friends, ctids){
  itemOp.find({_id: oid},{hasContracts:1})
  .then(function(item){
    if(item.hasContracts != null){
      for(var i=0; i < item.hasContracts.length; i++){
        if(friends.indexOf(item.hasContracts[i].id) === -1){
          ctids.push(item.hasContracts[i].id);
          item.hasContracts.splice(i, 1);
        }
      }
      return item.save();
    } else {
      return false;
    }
  })
  .then(function(response){
    if(response){
      return contractOp.find({_id:{$in: ctids}});
    } else {
      return false;
    }
  })
  .then(function(item){
    if(item){
      for(var i=0; i < item.iotOwner.items.length; i++){
        oid.push(item.iotOwner.items[i].id);
        item.hasContracts.items.splice(i, 1);
      }
      for(var j=0; j < item.serviceProvider.items.length; j++){
        oid.push(item.serviceProvider.items[j].id);
        item.hasContracts.items.splice(j, 1);
      }
      return item.save();
    } else {
      return {};
    }
  })
  .then(function(response){
    logger.debug('Change of accessLevel processed...');
  })
  .catch(function(error){
    logger.debug('Change of accessLevel error: ' + error);
  });
}

// Function exports ================================

module.exports.removeFriend = removeFriend;
module.exports.changePrivacy = changePrivacy;
module.exports.createContract = createContract;
module.exports.cancelContract = cancelContract;
module.exports.addItemsToContract = addItemsToContract;
