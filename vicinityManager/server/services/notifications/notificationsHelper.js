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
function getNotifications(u_id, c_id, cid, mail, isDevOps, all, searchDate, callback){
  var notifs = [];
  var query = {};
  // Set query based on user rights and specifications
  if(!all){ query = { $or: [{isUnread: true}, {status: 'waiting'}] }; }
  else{ query._id = { $gt: searchDate }; }

  userAccountOp.findOne({_id: c_id}, {hasNotifications:1})
  .populate({
    path: 'hasNotifications',
    match: query,
    populate: [
      { path:'actor.item', select: 'avatar name'},
      { path:'target.item', select: 'avatar name'},
      { path:'object.item'}
    ]
    // select: '-_id'
  })
  .then(function(data){
    notifs = notifs.concat(data.hasNotifications);
    return userOp.findOne({_id: u_id}, {hasNotifications:1})
    .populate({
      path: 'hasNotifications',
      match: query,
      populate: [
        { path:'actor.item', select: 'avatar name'},
        { path:'target.item', select: 'avatar name'},
        { path:'object.item'}
      ]
      // select: '-_id'
    });
  })
  .then(function(data){
    notifs = notifs.concat(data.hasNotifications);
    if(isDevOps){
      return notificationOp.find({type: 1, status: 'waiting'}).populate('actor.item');
    } else {
      return false;
    }
  })
  .then(function(data){
    if(data && data.length > 0){
      notifs = notifs.concat(data);
    }
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
          userOp.update({_id: target.item}, {$push: {hasNotifications: response._id}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        } else {
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

/*
Functions accessed from backend
*/
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


// Export functions
module.exports.getNotifications = getNotifications;
module.exports.createNotification = createNotification;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
module.exports.changeNotificationStatus = changeNotificationStatus;
