
var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var notificationOp = require('../../models/vicinityManager').notification;
var moment = require('moment');
var notifHelper = require('../../services/notifications/notificationsHelper');

/*
Get notifications
*/
function getNotifications(req,res){
  var obj = {};
  obj.u_id = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  obj.c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  obj.limit = Number(req.query.limit);
  obj.offset = Number(req.query.offset);
  obj.all = req.query.all === 'true';
  notifHelper.getNotifications(obj, function(err,response){
    if(err) logger.log(req, res, {data: response, type: "error"});
    res.json({error: err, message: response});
  });
}

/*
Refresh notifications count
*/
function refreshNotifications(req,res){
  var obj = {};
  obj.u_id = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  obj.c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  notifHelper.refreshNotifications(obj, function(err,response){
    if(err) logger.log(req, res, {data: response, type: "error"});
    res.json({error: err, message: response});
  });
}

// Functions to manipulate notifications
function changeToResponded(req,res){
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var stat = req.query.status;
  notifHelper.changeToResponded(o_id, stat, function(err,response){
    if(err) logger.log(req,res, {data: response, type: "error"});
    res.json({error: err, message: response});
  });
}

// Sets the notification to read
// Accepts single string or array

function changeIsUnreadToFalse(req, res){
  var id = req.params.id;
  var ids = req.body.ids;
  notifHelper.changeIsUnreadToFalse(id, ids, function(err,response){
    if(err) logger.log(req,res, {data: response, type: "error"});
    res.json({error: err, message: response});
  });
}

/*
Export functions
*/

// External rqst
module.exports.getNotifications = getNotifications;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
module.exports.refreshNotifications = refreshNotifications;
