/**
 * Created by viktor on 01.04.16.
 */

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;

// FUNCTIONS to get notifications

/*
Read and unread separately
*/
function getNotificationsOfUser(req,res){

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

 notificationOp.find({addressedTo: {$in : [o_id]}, isUnread: true}).populate('sentBy','avatar organisation').populate('deviceId','avatar name').exec(function(err,data){
   response = {"error": false, "message": data};
   res.json(response);

 });
}

function getNotificationsOfUserRead(req,res){

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

 notificationOp.find({addressedTo: {$in : [o_id]}, isUnread: false}).populate('sentBy','avatar organisation').populate('deviceId','avatar name').exec(function(err,data){
   response = {"error": false, "message": data};
   res.json(response);

 });

}

function getNotificationsOfRegistration(req,res){

  var response = {};

 notificationOp.find({type:"registrationRequest", isUnread: true}).populate('sentByReg','companyName').exec(function(err,data){
   response = {"error": false, "message": data};
   res.json(response);
 });
}

function getNotificationsOfRegistrationRead(req,res){

  var response = {};

 notificationOp.find({type:"registrationRequest", isUnread: false}).populate('sentByReg','companyName').exec(function(err,data){
   response = {"error": false, "message": data};
   res.json(response);
 });
}

/*
Read and unread together
*/
function getAllUserNotifications(req,res){

  var response = {};
  var dateFrom = objectIdWithTimestamp(req.query.searchDate);
  var o_id = mongoose.Types.ObjectId(req.params.id);
  notificationOp.find({addressedTo: {$in : [o_id]}, _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentBy','avatar organisation').populate('deviceId','avatar name').exec(function(err,data){
     response = {"error": false, "message": data};
     res.json(response);
  });
}

function getAllRegistrations(req,res){

  var dateFrom = objectIdWithTimestamp(req.query.searchDate);
  var response = {};
  notificationOp.find({type:"registrationRequest", _id: { $gt: dateFrom } }).sort({ _id: -1 }).populate('sentByReg','companyName').exec(function(err,data){
    response = {"error": false, "message": data};
    res.json(response);
  });
}


function getAll(req, res, next) {
//TODO: User authentic - Role check
  var response = {};

  notificationOp.find({}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

// Functions to manipulate notifications

function deleteNot(senderID, recepID, type, status){
    notificationOp.remove({ sentBy: senderID, addressedTo: {$in : [recepID]}, type: type, status: status},function(err, removed){
    });
}

function changeStatusToResponded(senderID, recepID, type, status){

    notificationOp.findOne({ sentBy: senderID, addressedTo: {$in : [recepID]}, type: type, status: status},function(err, data){
        var notif = data;
        // for (index in data){
          notif.status = 'responded';
          notif.save();
        // };
    });
}

function updateNotificationOfRegistration(req,res){
var response = {};
var o_id = mongoose.Types.ObjectId(req.params.id);
  notificationOp.findOneAndUpdate({sentByReg:o_id}, { $set: { status: 'responded', isUnread: false }}, { new: true }, function (err, notif) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": notif};
    }
    res.json(response);
  });
}

function changeStatusToResponded2(req,res){
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
    setAsRead(o_id, res);
  } else if(req.body.ids){
    setAsRead(req.body.ids);
  } else {
    response = {"error": true, "message": "Error fetching data"};
    res.json(response);
  }
  response = {"error": false, "message": "Notifications processed succesfully!"};
  res.json(response);
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

function markAsRead(sender_id, recipient_id, type, status){
    notificationOp.find({sentBy: sender_id, addressedTo: {$in :[recipient_id]}, type: type, isUnread: true, status: status},
        processFoundUnreadNotifications);
}

function processFoundUnreadNotifications(err, data){
    for (var index in data){
        var item = data[index];
        item.isUnread = false;
        item.save();
    }
}

// Private functions

function objectIdWithTimestamp(timestamp) {

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);

    // Create an ObjectId with that hex timestamp
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId;
}

// Export functions

module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.getNotificationsOfUser = getNotificationsOfUser;
module.exports.changeStatusToResponded = changeStatusToResponded;
module.exports.changeStatusToResponded2 = changeStatusToResponded2;
module.exports.updateNotificationOfRegistration = updateNotificationOfRegistration;
module.exports.getAll = getAll;
module.exports.markAsRead = markAsRead;
module.exports.deleteNot = deleteNot;
module.exports.getNotificationsOfUserRead = getNotificationsOfUserRead;
module.exports.getNotificationsOfRegistration = getNotificationsOfRegistration;
module.exports.getNotificationsOfRegistrationRead = getNotificationsOfRegistrationRead;
module.exports.getAllUserNotifications = getAllUserNotifications;
module.exports.getAllRegistrations = getAllRegistrations;
