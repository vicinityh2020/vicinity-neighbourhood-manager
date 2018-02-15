
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;

var notifHelper = require('../../services/notifications/notificationsHelper');

/*
Get notifications of user
*/
function getNotificationsOfUser(req,res){
  var o_id = mongoose.Types.ObjectId(req.params.id);
  notifHelper.getNotificationsOfUser(o_id, function(err,response){
    res.json({error: err, message: response});
  });
}

/*
Get notifications of registrations
*/
function getNotificationsOfRegistration(req,res){
  notifHelper.getNotificationsOfRegistration(function(err,response){
    res.json({error: err, message: response});
  });
}

/*
Get notifications of user based on date
*/
function getAllUserNotifications(req,res){
  var searchDate = req.query.hasOwnProperty('searchDate') ? req.query.searchDate : new Date(2017, 1, 1);

  var dateFrom = notifHelper.objectIdWithTimestamp(searchDate);
  var o_id = mongoose.Types.ObjectId(req.params.id);
  notifHelper.getAllUserNotifications(o_id, dateFrom, function(err,response){
    res.json({error: err, message: response});
  });
}

/*
Get notifications of registrations based on date
*/
function getAllRegistrations(req,res){
  var dateFrom = notifHelper.objectIdWithTimestamp(req.query.searchDate);
  notifHelper.getAllRegistrations(dateFrom, function(err,response){
    res.json({error: err, message: response});
  });
}

// Functions to manipulate notifications
function changeToResponded(req,res){
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var stat = req.query.status;
  notifHelper.changeToResponded(o_id, stat, function(err,response){
    res.json({error: err, message: response});
  });
}

// Sets the notification to read
// Accepts single string or array

function changeIsUnreadToFalse(req, res){
  var id = req.params.id;
  var ids = req.body.ids;
  notifHelper.changeIsUnreadToFalse(id, ids, function(err,response){
    res.json({error: err, message: response});
  });
}



/*
Functions accessed from backend
*/

function changeNotificationStatus(senderId, recepId, type, other){
    // Build the query only with the relevant keys
    var query = { 'type': type, 'status': 'waiting' };
    other = typeof other !== 'undefined' ? other : {};
    if(senderId !== ""){ query.sentBy = senderId; }
    if(recepId !== ""){ query.addressedTo = {$in : [recepId]}; }
    if(other.hasOwnProperty('itemId')){ query.itemId = other.itemId; }
    if(other.hasOwnProperty('sentByReg')){ query.sentByReg = other.sentByReg; }
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
Export functions
*/

// External rqst
module.exports.getNotificationsOfUser = getNotificationsOfUser;
module.exports.getNotificationsOfRegistration = getNotificationsOfRegistration;
module.exports.getAllUserNotifications = getAllUserNotifications;
module.exports.getAllRegistrations = getAllRegistrations;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
// Internal rqst
module.exports.changeNotificationStatus = changeNotificationStatus;
