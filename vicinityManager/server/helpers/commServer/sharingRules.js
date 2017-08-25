// Global objects and variables ================================

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var mySql = require('../../helpers/mySql/sendQuery');

// Public functions ================================

/*
An organisation stops being my partner
I need to remove my devices with friend data access Level
To do so, I remove the group which shares with my friend and the group which
my friend is using to share with me.
*/
function removeFriend(my_id, friend_id){
  var query = {};
  logger.debug('removing friend');
  askForDevices({ hasAdministrator: my_id, accessLevel: {$in:[3, 4, 7]} }, my_id + '_' + friend_id, 'DELETE');
  askForDevices({ hasAdministrator: friend_id, accessLevel: {$in:[3, 4, 7]} }, friend_id + '_' + my_id, 'DELETE');
  clearOldFriendIds(my_id, friend_id);
}

/*
An organisation is my new partner
I need to add my devices with friend data access Level
To do so I create two new groups.
First: Share the devices I want to share with my friend
Second: My friend shares some devices with me
These new groups share roster with the own devices group (Mine and of my friend)
*/
function newFriend(my_id, friend_id){
  var query = {};
  var payload = {};
  logger.debug('adding friend');
  // I share with my new friend
  commServer.callCommServer({ name: my_id + '_' + friend_id, description: my_id + ' shares with ' + friend_id }, 'groups', 'POST')
    .then(
      function(success){
          query = { hasAdministrator: my_id, accessLevel: {$in:[4, 7]} };
          askForDevices(query, my_id + '_' + friend_id, 'POST');
          //mySql.sendQuery(friend_id, my_id + '_' + friend_id);
        },
        function(error){
          if(error.statusCode !== 409){ // If the error is that the group already existed we ignore it
            callbackError(error);
          } else {
            logger.debug('Group already existed');
            query = { hasAdministrator: my_id, accessLevel: {$in:[4, 7]} };
            askForDevices(query, my_id + '_' + friend_id, 'POST');
          }
        }
      );
  // My friend shares with me
  commServer.callCommServer( { name: friend_id + '_' + my_id, description: friend_id + ' shares with ' + my_id }, 'groups', 'POST')
    .then(
      function(response){
      query = { hasAdministrator: friend_id, accessLevel: {$in:[4, 7]} };
      askForDevices(query, friend_id + '_' + my_id, 'POST');
      //mySql.sendQuery(my_id, friend_id + '_' + my_id);
    },
    function(error){
      if(error.statusCode !== 409){ // If the error is that the group already existed we ignore it
        callbackError(error);
      } else {
        logger.debug('Group already existed');
        query = { hasAdministrator: friend_id, accessLevel: {$in:[4, 7]} };
        askForDevices(query, friend_id + '_' + my_id, 'POST');
      }
    }
  );
}

/*
A device changes its accessLevel
I need to remove/add from/to the commServer groups accordingly
*/
function changePrivacy(updates){
  updates = Object(updates);
  var oldStatus = clasify(Number(updates.oldAccessLevel));
  var newStatus = clasify(Number(updates.accessLevel));
  logger.debug(oldStatus + ' to ' + newStatus);
  findCase(oldStatus, newStatus, updates);
  logger.debug('Change of accessLevel processed...');
}

/*
Organisation accepts user request to get device data
Could be that the sharing group between companies did not exist,
prior device registration in comm Server we check that
*/
function acceptUserRequest(oid, my_id, friend_id){
  commServer.callCommServer({ name: my_id + '_' + friend_id, description: my_id + ' shares with ' + friend_id }, 'groups', 'POST')
    .then(
      function(success){
          commServer.callCommServer({}, 'users/' + oid + '/groups/' + my_id +  '_' + friend_id, 'POST');
          //mySql.sendQuery(friend_id, my_id + '_' + friend_id);
      },
      function(error){
        if(error.statusCode !== 409){ // If the error is that the group already existed we ignore it
          callbackError(error);
        } else {
          logger.debug('Group already existed');
          commServer.callCommServer({}, 'users/' + oid + '/groups/' + my_id +  '_' + friend_id, 'POST');
        }
      }
    );
}

/*
Organisation cancels item access (Currently only non owner organisation can cancel this way!!)
*/
function cancelItemAccess(oid, admin_id, friend_id){
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + admin_id + '_' + friend_id , 'DELETE');
}

// Private functions ================================

/*
Retrieve all devices with friend data access of the given organisation id
Necessary to forward only oid and accessLevel
*/
function askForDevices(query, groupName, method){
  var result = [];
  itemOp.find(query,{oid: 1, accessLevel: 1},
    function(err,data){
      if( err ){
        callbackError(err);
      } else {
        if( data.length !== 0 ){
          processCommServerManyDevices(data, groupName, method);
        } else {
          logger.debug('No data to be processed...');
        }
      }
    }
  );
}

/*
Add/remove from foreignDevices group in commServer
For MANY devices and a SINGLE organisation
*/
function processCommServerManyDevices(data, groupName, method){
  commServer.callCommServer({}, 'users/' + data[0].oid + '/groups/' + groupName, method);
  data.splice(0,1);
  if(data.length !== 0){
    processCommServerManyDevices(data, orgId, method);
  }
}

/*
Add/remove from foreignDevices group in commServer
For a SINGLE device and MANY organisations
*/
function processCommServerManyOrgs(cid, data, oid, method){
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_' + data[0], method)
    .then(
      function(response){
        data.splice(0,1);
        if(data.length !== 0){
          processCommServerManyOrgs(cid, data, oid, method);
        }
      },
      function(err){
        if(err.statusCode !== 404){ // If the error is that the group wasn't found we ignore it
          callbackError(err);
        } else {
          data.splice(0,1);
          if(data.length !== 0){
            processCommServerManyOrgs(cid, data, oid, method);
          }
        }
      }
    );
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
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'POST');

  } else if(oldA === "public" && newA === "request") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'DELETE');

  } else if(oldA === "private" && newA === "public") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');

  } else if(oldA === "private" && newA === "friend") {
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'POST');

  } else if(oldA === "private" && newA === "request") {
    logger.debug("No action required!");

  } else if(oldA === "friend" && newA === "private") {
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "friend" && newA === "public") {
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "friend" && newA === "request") {
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'DELETE');

  } else if(oldA === "request" && newA === "public") {
    processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, 'DELETE');
    commServer.callCommServer({}, 'users/' + updates.oid + '/groups/' + 'publicDevices', 'POST');
    removeHasAccess(updates.oid);

  } else if(oldA === "request" && newA === "friend") {
    getNotFriends(updates, 'POST');

  } else if(oldA === "request" && newA === "private") {
    getNotFriends(updates, 'DELETE');

  } else if(oldA === "request" && newA === "request") {
    // TODO Refactor and add new features to the required items. Add to the UI as well.
    getNotFriends(updates, 'NONE');
    logger.debug('TODO Address case noted in the comments!');

  } else {
    logger.debug("No action required!");
  }
}

/*
When a device leaves the state 'underRequest', it needs to clean the buffer of orgs which requested
access or has granted access. Both arrays are reset to null [].
*/
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
    Find users with access to my item and that are not friends,
    delete them form commServer.
    Necessary to check when device was previously underRequest
    */
    function getNotFriends(updates, method){
      var notFriends = [];
      var id = updates.oid;
      var friends = updates.myFriends;
      var cid = updates.cid;
      itemOp.find({oid:id},
        function (err, data) {
          if (err || data === null) {
              response = {"error": true, "message": "Processing data failed!"};
          } else {
              if (data[0].hasAccess.length > 0) {
                  var device = data[0];
                  for(var i = 0; i < device.hasAccess.length; i++){
                    var flag = 0;
                    flag = friends.indexOf(device.hasAccess[i].toString());
                    logger.debug(flag);
                    if(flag === -1){
                      notFriends.push(device.hasAccess[i]);
                    }
                  }
                  logger.debug(notFriends);
                  if(notFriends.length > 0){
                    processCommServerManyOrgs(cid, notFriends, id, 'DELETE');
                  }
                }
              }
              if(method !== 'NONE'){
                processCommServerManyOrgs(updates.cid, updates.myFriends, updates.oid, method);
                removeHasAccess(updates.oid);
              }
            }
          );
        }

    /*
    TODO Improve it, old version
    When a friendship ends, all oids belonging to my ex friend have to be removed
    from my organisation document in MONGO
    */
    function clearOldFriendIds(adminId, friendId){
        itemOp.find({ hasAdministrator: {$in : [adminId]}, accessRequestFrom: {$in : [friendId]}, accessLevel: {$in : [3, 4, 7]}},function(err, data){
            var dev = {};
            var index;
            for (index in data){
              dev = data[index];

              for (var index2 = dev.accessRequestFrom.length - 1; index >= 0; index --) {
                  if (dev.accessRequestFrom[index2].toString() === friendId.toString()) {
                      dev.accessRequestFrom.splice(index2, 1);
                  }
              }
              dev.save();
            }
        });
        itemOp.find({ hasAdministrator: {$in : [adminId]}, hasAccess: {$in : [friendId]}, accessLevel: {$in : [3, 4, 7]}},function(err, data){
            var dev = {};
            var index;
            for (index in data){
              dev = data[index];
              var index2;
              for (index2 = dev.hasAccess.length - 1; index >= 0; index --) {
                  if (dev.hasAccess[index2].toString() === friendId.toString()) {
                      dev.hasAccess.splice(index2, 1);
                  }
              }
              dev.save();
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
module.exports.acceptUserRequest = acceptUserRequest;
module.exports.cancelItemAccess = cancelItemAccess;
