// Global objects and variables ================================

var mongoose = require('mongoose');
var itemOp = require('../models/vicinityManager').item;
var userAccountOp = require('../models/vicinityManager').userAccount;
var contractOp = require('../models/vicinityManager').contract;
var logger = require("../middlewares/logger");
var commServer = require('../helpers/commServer/request');
var notificationAPI = require('../routes/notifications/notifications');
var sync = require('../helpers/asyncHandler/sync');

// Public functions ================================

/*
An organisation stops being my partner
I need to remove my devices with friend data access Level
To do so, I remove the group which shares with my friend and the group which
my friend is using to share with me.
*/
function removeFriend(my_id, friend_id){
  logger.debug('removing friend');
  // Remove contracts between both organisations which contain items for friends
}

/*
A device changes its accessLevel
I need to remove/add from/to the commServer groups accordingly
*/
function changePrivacy(updates){
  var oldStatus = Number(updates.oldAccessLevel);
  var newStatus = Number(updates.accessLevel);
  logger.debug(oldStatus + ' to ' + newStatus);
  findCase(oldStatus, newStatus, updates);
  logger.debug('Change of accessLevel processed...');
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
function addItemsToContract(id, items){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          adding(value, otherParams, function(value, result) {
              logger.debug('END execution with value =', value, 'and result =', result);
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
        {id: id}
      );
    } else {
      // logger.warn({user:email, action: 'deleteItem', message: "No items to be removed"});
      resolve({"error": false, "message": "Nothing to be removed..."});
    }
  });
}

/*
Remove contract group in commServer
*/
function cancelContract(id){
  return commServer.callCommServer({}, 'groups/' + id, 'DELETE');
}

// Private functions ================================

/*
Find how to resolve the accessLevel change in the device
Based on old and new accessLevel captions
*/
function findCase(oldA, newA, updates){
  if(oldA === 2 && newA === 1) {
    // Remove contract where I belong AND the other company is not friend or remove the item only ??
    // Notify and audit

  } else if(oldA === 2 && newA === 0) {
    // Remove contract where I belong or remove the item only ??
    // Notify and audit

  } else if(oldA === 1 && newA === 0) {
    // Remove contract where I belong or remove the item only ??
    // Notify and audit

  } else {
    logger.debug("No action required!");
  }
}

/*
Add items to contract group in commServer
*/
function adding(oid, otherParams, callback){
  logger.debug('START execution with value =', oid);
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.id , 'POST')
  .then(function(ans){
    //logger.audit({user: otherParams.userMail, action: 'deleteItem', item: oid });
    callback(oid, "Success");})
  .catch(function(err){
      //logger.error({user: otherParams.userMail, action: 'deleteItem', item: oid, message: err });
      callback(oid, 'Error: ' + err);
  });
}



// Function exports ================================

module.exports.removeFriend = removeFriend;
module.exports.changePrivacy = changePrivacy;
module.exports.createContract = createContract;
module.exports.cancelContract = cancelContract;
module.exports.addItemsToContract = addItemsToContract;
