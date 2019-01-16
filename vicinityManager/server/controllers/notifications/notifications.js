
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
  obj.pending = req.query.pending === 'true';
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

/*
Export functions
*/

// External rqst
module.exports.getNotifications = getNotifications;
module.exports.refreshNotifications = refreshNotifications;
