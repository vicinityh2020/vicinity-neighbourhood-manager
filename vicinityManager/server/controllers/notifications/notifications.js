
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var notificationOp = require('../../models/vicinityManager').notification;

var notifHelper = require('../../services/notifications/notificationsHelper');

/*
Get notifications
*/
function getNotifications(req,res){
  var u_id = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var cid = req.body.decoded_token.cid;
  var mail = req.body.decoded_token.sub;
  var isAdmin = req.body.decoded_token.roles.indexOf('administrator') !== -1;
  var all = req.query.hasOwnProperty('all') ? true : false;
  var searchDate = req.query.hasOwnProperty('searchDate') ? notifHelper.objectIdWithTimestamp(req.query.searchDate) : new Date(2017,1,1);
  notifHelper.getNotifications(u_id, c_id, cid, mail, isAdmin, all, searchDate, function(err,response){
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
Export functions
*/

// External rqst
module.exports.getNotifications = getNotifications;
module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.changeToResponded = changeToResponded;
