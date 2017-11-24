
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;
var notifHelper = require('../../helpers/notifications/notificationsHelper');

// FUNCTIONS accessed from frontend

/*
Get notifications of user
*/
function getNotificationsOfUser(req,res){

  var o_id = mongoose.Types.ObjectId(req.params.id);

  notificationOp.find({addressedTo: {$in : [o_id]}, $or: [{isUnread: true}, {status: 'waiting'}]}).sort({ _id: -1 }).populate('sentBy','avatar organisation').populate('addressedTo','organisation').populate('itemId','avatar name').exec(function(err,data){
      if(err){
        res.json({"error": true, "message": "Error fetching data"});
      } else {
        res.json({"error": false, "message": data});
      }
    });
}

/*
Get notifications of registrations
*/
function getNotificationsOfRegistration(req,res){

   notificationOp.find({type: 1, $or: [{isUnread: true}, {status: 'waiting'}]}).sort({ _id: -1 }).populate('sentByReg','companyName').exec(function(err,data){
     if(err){
       res.json({"error": true, "message": "Error fetching data"});
     } else {
       res.json({"error": false, "message": data});
     }
   });
}

/*
Get notifications of user based on date
*/
function getAllUserNotifications(req,res){

  var dateFrom = notifHelper.objectIdWithTimestamp(req.query.searchDate);

  var o_id = mongoose.Types.ObjectId(req.params.id);
  notificationOp.find({addressedTo: {$in : [o_id]}, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentBy','avatar organisation').populate('addressedTo','organisation').populate('itemId','avatar name').exec(function(err,data){
    if(err){
      res.json({"error": true, "message": "Error fetching data"});
    } else {
      res.json({"error": false, "message": data});
    }
  });
}

/*
Get notifications of registrations based on date
*/
function getAllRegistrations(req,res){

  var dateFrom = notifHelper.objectIdWithTimestamp(req.query.searchDate);

  notificationOp.find({type: 1, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentByReg','companyName').exec(function(err,data){
    if(err){
      res.json({"error": true, "message": "Error fetching data"});
    } else {
      res.json({"error": false, "message": data});
    }
  });
}

// Functions to manipulate notifications
function changeToResponded(req,res){
var o_id = mongoose.Types.ObjectId(req.params.id);
var stat = req.query.status;
  notificationOp.findByIdAndUpdate(o_id, { $set: { status: stat, isUnread: false }}, { new: true }, function (err, notif) {
    if (err) {
      res.json({"error": true, "message": "Error fetching data"});
    } else {
      res.json({"error": false, "message": notif});
    }
  });
}

// Sets the notification to read
// Accepts single string or array

function changeIsUnreadToFalse(req, res){
  var o_id = [];
  if(req.params.id && req.params.id !== '0'){
    o_id.push(mongoose.Types.ObjectId(req.params.id));
    notifHelper.setAsRead(o_id)
    .then(function(response){res.json({"error": false, "message": "Notifications processed succesfully!"});})
    .catch(function(error){res.json({"error": true, "message": "Error fetching data"});});
  } else if(req.body.ids){
    notifHelper.setAsRead(req.body.ids)
    .then(function(response){res.json({"error": false, "message": "Notifications processed succesfully!"});})
    .catch(function(error){res.json({"error": true, "message": "Error fetching data"});});
  } else {
    res.json({"error": true, "message": "Error fetching data"});
  }
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
