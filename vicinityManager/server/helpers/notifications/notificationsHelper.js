// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;

// Functions

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
  var response = {};
  notificationOp.update({_id: ids[0]}, { $set: { isUnread: false }}, function (err, notif) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
      res.json(response);
    }
  });
  ids.splice(0,1);
  if(ids.length > 0){
    setAsRead(ids);
  }
}

// Export functions
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
module.exports.setAsRead = setAsRead;
