/**
 * Created by viktor on 01.04.16.
 */

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

  notificationOp.find({addressedTo: {$in : [o_id]}, $or: [{isUnread: true}, {status: 'waiting'}]}).sort({ _id: -1 }).populate('sentBy','avatar organisation').populate('itemId','avatar name').exec(function(err,data){
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
  notificationOp.find({addressedTo: {$in : [o_id]}, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentBy','avatar organisation').populate('itemId','avatar name').exec(function(err,data){
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
var response = {};
var o_id = mongoose.Types.ObjectId(req.params.id);
var stat = req.params.status;
  notificationOp.findByIdAndUpdate(o_id, { $set: { status: stat, isUnread: false }}, { new: true }, function (err, notif) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": notif};
    }
    res.json(response);
  });
}

/*
Sets the notification to read
Accepts single string or array
*/
function changeIsUnreadToFalse(req, res){
  var o_id = [];
  if(req.params.id && req.params.id != '0'){
    o_id.push(mongoose.Types.ObjectId(req.params.id));
    notifHelper.setAsRead(o_id, res);
  } else if(req.body.ids){
    notifHelper.setAsRead(req.body.ids, res);
  } else {
    response = {"error": true, "message": "Error fetching data"};
    res.json(response);
  }
  response = {"error": false, "message": "Notifications processed succesfully!"};
  res.json(response);
}



// Functions accessed from backend

function deleteNot(senderID, recepID, type, status){
    notificationOp.remove({ sentBy: senderID, addressedTo: {$in : [recepID]}, type: type, status: status},function(err, removed){});
}

function changeStatusToResponded(senderID, recepID, type, status){
    notificationOp.findOne({ sentBy: senderID, addressedTo: {$in : [recepID]}, type: type, status: status},
      function(err, data){
        var notif = data;
        notif.status = 'responded';
        notif.save();
      }
    );
  }

function markAsRead(sender_id, recipient_id, type, status){
    notificationOp.find({sentBy: sender_id, addressedTo: {$in :[recipient_id]}, type: type, isUnread: true, status: status},
      function(err, data){
        for (var index in data){
            var item = data[index];
            item.isUnread = false;
            item.save();
        }
      }
    );
  }

// Export functions

module.exports.getNotificationsOfUser = getNotificationsOfUser;
module.exports.getNotificationsOfRegistration = getNotificationsOfRegistration;
module.exports.getAllUserNotifications = getAllUserNotifications;
module.exports.getAllRegistrations = getAllRegistrations;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;

module.exports.changeStatusToResponded = changeStatusToResponded;
module.exports.markAsRead = markAsRead;
module.exports.deleteNot = deleteNot;
