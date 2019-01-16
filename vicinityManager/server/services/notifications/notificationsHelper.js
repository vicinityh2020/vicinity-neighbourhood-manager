// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
var asyncHandler = require('../../services/asyncHandler/sync');

/*
Get notifications
*/
function getNotifications(obj, callback){
  var allNotifs = [];
  var result = {};
  var query = {};
  var todoAsync = [];
  result.notifications = [];
  result.count = 0;

  todoAsync.push(userAccountOp.findOne({_id: obj.c_id}, {hasNotifications:1}).lean());
  todoAsync.push(userOp.findOne({_id: obj.u_id}, {hasNotifications:1}).lean());

  Promise.all(todoAsync)
  .then(function(data){
    allNotifs = data[0].hasNotifications.concat(data[1].hasNotifications);
    // Get #limit more recent notifications including #offset
    // Update them to read
    // Populate with needed fields
    // If "all" is false then retrieve unread or waiting notifications only
    query._id = {$in: allNotifs};
    if(obj.pending){
      query.$or = [{isUnread: true}, {status: "waiting"}];
    } else {
      query.status = {$ne: "responded"};
    }
    return notificationOp.find(query)
    .sort({_id:-1})
    .skip(obj.offset)
    .limit(obj.limit)
    .populate('actor.item', 'avatar name')
    .populate('target.item', 'avatar name')
    .populate('object.item')
    .lean();
  })
  .then(function(data){
    result.notifications = data;
  // Update to read if notification was new
    var idsToRead = [];
    for(var i = 0, l = data.length; i < l; i++){
      if(data[i].isUnread === true) idsToRead.push(data[i]._id);
    }
    if(idsToRead.length !== 0){
      return notificationOp.update({_id: {$in: idsToRead}}, { $set: { isUnread: false }}, {multi: true});
    } else {
      return false;
    }
  })
  .then(function(data){
    return notificationOp.count({"_id": {$in: allNotifs}, isUnread: true});
  })
  .then(function(data){
    result.count = data;
    callback(false, result);
  })
  .catch(function(error){
    callback(true, error);
  });
}

/*
Refresh notifications count
*/
function refreshNotifications(obj, callback){
  var allNotifs = [];
  var result = {};
  var todoAsync = [];
  result.count = 0;

  todoAsync.push(userAccountOp.findOne({_id: obj.c_id}, {hasNotifications:1}).lean());
  todoAsync.push(userOp.findOne({_id: obj.u_id}, {hasNotifications:1}).lean());

  Promise.all(todoAsync)
  .then(function(data){
    allNotifs = data[0].hasNotifications.concat(data[1].hasNotifications);
    return notificationOp.count({"_id": {$in: allNotifs}, isUnread: true});
  })
  .then(function(data){
    result.count = data;
    callback(false, result);
  })
  .catch(function(error){
    callback(true, error);
  });
}

/*******************************
Functions accessed from backend
*******************************/

/*
Create a notification
*/
function createNotification(actor, target, object, status, type, message){
  return new Promise(function(resolve, reject) {
    var notif = new notificationOp();
    notif.actor = actor;
    notif.target = target;
    notif.object = object;
    notif.status = status;
    notif.type = type;
    notif.message = message;
    notif.save(function(err, response){
      if(err){
        reject(err);
      } else {
        if(target.kind === 'user'){
          userOp.update({_id: target.item}, {$push: {hasNotifications: response._id}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        } else if(target.kind === 'userAccount'){
          userAccountOp.update({_id: target.item}, {$push: {hasNotifications: response._id}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        }
      }
    });
  });
}

// Functions to manipulate notifications
function changeToResponded(o_id, stat, callback){
  notificationOp.findByIdAndUpdate(o_id, { $set: { status: stat, isUnread: false }}, { new: true }, function (err, response) {
    if(err){ callback(true, response); } else { callback(false, response); }
  });
}

/**************************************
Other functions: To be replaced/removed
**************************************/

// Converts mongo ID to timestamp
function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
    return constructedObjectId;
}

// Sets the notification to read
// Accepts single string or array
function changeIsUnreadToFalse(id, ids, callback){
  var o_id = [];
  if(id && id !== '0'){
    o_id.push(mongoose.Types.ObjectId(id));
    setAsRead(o_id)
    .then(function(response){callback(false, response);})
    .catch(function(error){callback(true, error);});
  } else if(ids){
    setAsRead(ids)
    .then(function(response){callback(false, response);})
    .catch(function(error){callback(true, error);});
  } else {
    callback(true, "Missing id");
  }
}

// Recursively sets all notifs to read
function setAsRead(ids){
  return new Promise(function(resolve, reject) {
  if(ids.length > 0){
    asyncHandler.forEachAll(ids,
      function(value, allresult, next) {
        readOne(value, function(value, result) {
            allresult.push({value: value, result: result});
            next();
        });
      },
      function(allresult) {
        if(allresult.length === ids.length){
          resolve(JSON.stringify(allresult));
        }
      },
      false
    );
  } else {
    resolve("Nothing to be read");
  }
});
}


// Supporting setAsRead
function readOne(idToRead, callback){
    notificationOp.update({_id: idToRead}, { $set: { isUnread: false }}, function (err, notif) {
    if (err) {
      logger.error(err);
      callback(idToRead, 'Error');
    }
    else { callback(idToRead, 'Success'); }
  });
}

// Modify status
function changeNotificationStatus(targetId, objectId, type, other){

    // Build the query only with the relevant keys
    var query = { 'type': type, 'status': 'waiting' };
    other = typeof other !== 'undefined' ? other : {};
    if(targetId !== ""){ query['target.item'] = targetId; }
    if(objectId !== ""){ query['object.item'] = objectId; }
    // if(other.hasOwnProperty('itemId')){ query.itemId = other.itemId; }
    if(other.hasOwnProperty('sentByReg')){ query['actor.item'] = other.sentByReg; }
    // Change status of found notifs
    notificationOp.find(query,
      function(err, notif){
        if(err){
          logger.debug("Error changing status of notification!!");
        } else if(!(notif)){
          logger.debug("Notif not found in changing status of notification!!");
        } else {
          var toChange = [];
          for(var n = 0; n < notif.length; n++){
            notif[n].status = 'responded';
            notif[n].isUnread = false;
            toChange.push(notif[n].save());
          }
          Promise.all(toChange)
          .then(function(response){ Promise.resolve('Success'); })
          .catch(function(err){ Promise.reject('Error'); });
        }
      }
    );
  }


// Export functions
module.exports.getNotifications = getNotifications;
module.exports.refreshNotifications = refreshNotifications;
module.exports.createNotification = createNotification;
module.exports.changeToResponded = changeToResponded;
// Other
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
module.exports.changeNotificationStatus = changeNotificationStatus;
