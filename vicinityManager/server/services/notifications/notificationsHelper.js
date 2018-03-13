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
function getNotifications(u_id, c_id, cid, mail, isAdmin, all, searchDate, callback){
  var notifs = [];
  var query = {};
  // Set query based on user rights and specifications
  if(!all){ query = { $or: [{isUnread: true}, {status: 'waiting'}] }; }
  else{ query._id = { $gt: searchDate }; }
  if(!isAdmin) query.type = {$ne: 1};

  userAccountOp.findOne({_id: c_id}, {hasNotifications:1})
  .populate({
    path: 'hasNotifications',
    match: query,
    // select: '-_id'
  })
  .then(function(data){
    notifs.push(data.hasNotifications);
    return user.findOne({_id: u_id}, {hasNotifications:1})
    .populate({
      path: 'hasNotifications',
      match: query,
      // select: '-_id'
    });
  })
  .then(function(data){
    notifs.push(data.hasNotifications);
    callback(false, notifs);
  })
  .catch(function(error){
    callback(true, error);
  });
}

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
          userOp.update({_id: target.item}, {$push: {hasNotifications: response_id}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        } else {
          userAccountOp.update({_id: target.item}, {$push: {hasNotifications: response_id}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        }
      }
    });
  });
}

// Functions to manipulate notifications
function changeToResponded(o_id, stat, callback){
  notificationOp.findByIdAndUpdate(o_id, { $set: { status: stat, isUnread: false }}, { new: true }, function (err, data) {
    if(err){ callback(true, err); } else { callback(false, data); }
  });
}

// Sets the notification to read
// Accepts single string or array

function changeIsUnreadToFalse(id, ids, callback){
  var o_id = [];
  if(id && id !== '0'){
    o_id.push(mongoose.Types.ObjectId(id));
    setAsRead(o_id)
    .then(function(response){callback(false, "Notifications processed succesfully!");})
    .catch(function(error){callback(true, "Error fetching data");});
  } else if(ids){
    setAsRead(ids)
    .then(function(response){callback(false, "Notifications processed succesfully!");})
    .catch(function(error){callback(true, "Error fetching data");});
  } else {
    callback(true, "Error fetching data");
  }
}

/*
Functions accessed from backend
*/
function changeNotificationStatus(targetId, objectId, type, other){
    // Build the query only with the relevant keys
    var query = { 'type': type, 'status': 'waiting' };
    other = typeof other !== 'undefined' ? other : {};
    if(senderId !== ""){ query.target.item = targetId; }
    if(recepId !== ""){ query.object.item = objectId; }
    // if(other.hasOwnProperty('itemId')){ query.itemId = other.itemId; }
    if(other.hasOwnProperty('sentByReg')){ query.actor.item = other.sentByReg; }
    // Change status of found notifs
    notificationOp.find(query,
      function(err, notif){
        if(err){
          logger.debug("Error changing status of notification!!");
        } else if(!(notif)){
          logger.debug("Notif not found in changing status of notification!!");
        } else {
          for(var n = 0; n < notif.length; n++){
            notif[n].status = 'responded';
            notif[n].isUnread = false;
            notif[n].save();
          }
        }
      }
    );
  }

/*
Private functions
*/

// Converts mongo ID to timestamp
function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
    return constructedObjectId;
}

// Recursively sets all notifs to read
function setAsRead(ids, res){
  return new Promise(function(resolve, reject) {
  if(ids.length > 0){ // Check if there is any item to delete
    logger.debug('Start async handler...');
    asyncHandler.forEachAll(ids,
      function(value, allresult, next) {
        readOne(value, function(value, result) {
            // logger.debug('END execution with value =', value, 'and result =', result);
            allresult.push({value: value, result: result});
            next();
        });
      },
      function(allresult) {
        if(allresult.length === ids.length){
          logger.debug('Completed async handler: ' + JSON.stringify(allresult));
          resolve({"error": false, "message": allresult });
        }
      },
      false
    );
  } else {
    resolve({"error": false, "message": "Nothing to be read..."});
  }
});
}


// Supporting setAsRead
function readOne(idToRead, callback){
    notificationOp.update({_id: idToRead}, { $set: { isUnread: false }}, function (err, notif) {
    if (err) { callback(idToRead, "Error: " + err); }
    else { callback(idToRead, "Success"); }
  });
}


// Export functions
module.exports.getNotifications = getNotifications;
module.exports.createNotification = createNotification;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
module.exports.changeNotificationStatus = changeNotificationStatus;
