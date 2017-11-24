// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;
var asyncHandler = require('../../helpers/asyncHandler/sync');

/*
Public functions
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

/*
Private function
*/

// Supporting setAsRead
function readOne(idToRead, callback){
    notificationOp.update({_id: idToRead}, { $set: { isUnread: false }}, function (err, notif) {
    if (err) { callback(idToRead, "Error: " + err); }
    else { callback(idToRead, "Success"); }
  });
}


// Export functions
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
