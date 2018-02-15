// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;
var asyncHandler = require('../../services/asyncHandler/sync');


/*
Get notifications of user
*/
function getNotificationsOfUser(o_id, callback){
  notificationOp.find({addressedTo: {$in : [o_id]}, $or: [{isUnread: true}, {status: 'waiting'}]}).sort({ _id: -1 }).populate('sentBy','avatar name').populate('addressedTo','name').populate('itemId','avatar name').exec(function(err,data){
      if(err){ callback(true, err); } else { callback(false, data); }
    });
  }

/*
Get notifications of registrations
*/
function getNotificationsOfRegistration(callback){
   notificationOp.find({type: 1, $or: [{isUnread: true}, {status: 'waiting'}]}).sort({ _id: -1 }).populate('sentByReg','companyName').exec(function(err,data){
     if(err){ callback(true, err); } else { callback(false, data); }
   });
 }

/*
Get notifications of user based on date
*/
function getAllUserNotifications(o_id, dateFrom, callback){
  notificationOp.find({addressedTo: {$in : [o_id]}, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentBy','avatar name').populate('addressedTo','name').populate('itemId','avatar name').exec(function(err,data){
    if(err){ callback(true, err); } else { callback(false, data); }
  });
}

/*
Get notifications of registrations based on date
*/
function getAllRegistrations(dateFrom, callback){
  notificationOp.find({type: 1, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentByReg','companyName').exec(function(err,data){
    if(err){ callback(true, err); } else { callback(false, data); }
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
module.exports.getNotificationsOfUser = getNotificationsOfUser;
module.exports.getNotificationsOfRegistration = getNotificationsOfRegistration;
module.exports.getAllUserNotifications = getAllUserNotifications;
module.exports.getAllRegistrations = getAllRegistrations;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
