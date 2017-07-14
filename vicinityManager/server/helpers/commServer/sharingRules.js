// Global objects and variables ================================

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');

// Public functions ================================

/*
An organisation stops being my partner
I need to remove my devices with friend data access Level
from its foreignDevices group and viceversa
*/
function removeFriend(my_id, friend_id){
  var query = {};
  logger.debug('removing friend');
  query = { hasAdministrator: my_id, accessLevel:{$in:[3, 4, 7]} };
  askForDevices(query, friend_id, 'DELETE');
  query = { hasAdministrator: friend_id, accessLevel:{$in:[3, 4, 7]} };
  askForDevices(query, my_id, 'DELETE');
}

/*
An organisation is my new partner
I need to add my devices with friend data access Level
to its foreignDevices group and viceversa
*/
function newFriend(my_id, friend_id){
  var query = {};
  logger.debug('adding friend');
  query = { hasAdministrator: my_id, accessLevel:{$in:[4, 7]} };
  askForDevices(query, friend_id, 'POST');
  query = { hasAdministrator: friend_id, accessLevel:{$in:[4, 7]} };
  askForDevices(query, my_id, 'POST');
}

/*
A device changes its accessLevel
I need to remove/add from/to the commServer groups accordingly
*/
function changePrivacy(updates){
  var oldStatus = clasify(Number(updates.oldAccessLevel));
  var newStatus = clasify(Number(updates.accessLevel));
  logger.debug(oldStatus + '   ' + newStatus);
  logger.debug(JSON.stringify(updates));
  findCase(oldStatus, newStatus, updates);
  logger.debug('Change of accessLevel processed...');
}

// Private functions ================================

/*
Retrieve all devices with friend data access of the given organisation id
Necessary to forward only oid and accessLevel
*/
function askForDevices(query, id, method){
  var result = [];
  itemOp.find(query,{oid: 1, accessLevel: 1},
    function(err,data){
      if( !data || err ){
        callbackError(err);
      } else {
        processCommServerManyDevices(data, id, method);
      }
    }
  );
}

/*
Add/remove from foreignDevices group in commServer
For MANY devices and a SINGLE organisation
*/
function processCommServerManyDevices(data, orgId, method){
  commServer.callCommServer({}, 'users/' + data[0].oid + '/groups/' + orgId + '_foreignDevices', method);
  data.splice(0,1);
  if(data.length !== 0){
    processCommServerManyDevices(data, orgId, method);
  }
}

/*
Add/remove from foreignDevices group in commServer
For a SINGLE device and MANY organisations
*/
function processCommServerManyOrgs(data, oid, method){
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + data[0] + '_foreignDevices', method);
  data.splice(0,1);
  if(data.length !== 0){
    processCommServerManyOrgs(data, oid, method);
  }
}

/*
Converts accessLevel number to actual data accessLevel caption
*/
function clasify(lvl){
    switch (lvl) {
        case 1:
            caption = "private";
            break;
        case 2:
            caption = "private";
            break;
        case 3:
            caption = "request";
            break;
        case 4:
            caption = "friend";
            break;
        case 5:
            caption = "private";
            break;
        case 6:
            caption = "request";
            break;
        case 7:
            caption = "friend";
            break;
        case 8:
            caption = "public";
    }
    return caption;
}

/*
Find how to resolve the accessLevel change in the device
Based on old and new accessLevel captions
*/
function findCase(oldA, newA, updates){
  logger.debug(oldA);
  logger.debug(newA);
  if(oldA === "public" && newA === "private"){
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'DELETE');

  } else if(oldA === "public" && newA === "friend") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'DELETE');
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'POST');

  } else if(oldA === "public" && newA === "request") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'DELETE');

  } else if(oldA === "private" && newA === "public") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');

  } else if(oldA === "private" && newA === "friend") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'POST');

  } else if(oldA === "private" && newA === "request") {
    logger.debug("No action required!");

  } else if(oldA === "friend" && newA === "private") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "friend" && newA === "public") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "friend" && newA === "request") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "request" && newA === "public") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'DELETE');
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');
    removeHasAccess(updates.oid);

  } else if(oldA === "request" && newA === "friend") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'POST');
    removeHasAccess(updates.oid);

  } else if(oldA === "request" && newA === "private") {
    processCommServerManyOrgs(updates.myFriends, updates.oid, 'DELETE');
    removeHasAccess(updates.oid);

  } else {
    logger.debug("No action required!");
  }
}

function removeHasAccess(id){
  itemOp.find({oid:id},
    function (err, data) {
      if (err || data === null) {
          response = {"error": true, "message": "Processing data failed!"};
      } else {
          if (data.length === 1) {
              var device = data[0];
              device.accessRequestFrom = device.hasAccess = [];
              device.save();
            }
          }
        }
      );
    }

/*
Handles errors
*/
function callbackError(err){
  logger.debug("We could not process sharing rules: " + err);
}
// Function exports ================================

module.exports.removeFriend = removeFriend;
module.exports.newFriend = newFriend;
module.exports.changePrivacy = changePrivacy;
