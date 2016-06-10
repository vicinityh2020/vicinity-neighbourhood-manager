/**
 * Created by viktor on 01.04.16.
 */

var mongoose = require('mongoose');

var winston = require('winston');

var userAccountOp = require('../../models/vicinityManager').userAccount;
var userAccountOp2 = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;

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

function getNotificationsOfUser(req,res){
  // winston.log('debug','Start getNotificationsOfUser');

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

 notificationOp.find({addressedTo: {$in : [o_id]}, isUnread: true}).populate('sentBy','avatar organisation').populate('deviceId','avatar name').exec(function(err,data){
   response = {"error": false, "message": data};
  //  winston.log('debug','responding getNotificationsOfUser');
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

function changeIsUnreadToFalse(req, res){
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    notificationOp.findOne({_id: o_id},function(err,data){
      var notif = data;
      notif.isUnread = false;
      notif.save();

      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": notif};
      }
      res.json(response);
    });
}

module.exports.changeIsUnreadToFalse = changeIsUnreadToFalse;
module.exports.getNotificationsOfUser = getNotificationsOfUser;
module.exports.changeStatusToResponded = changeStatusToResponded;
module.exports.getAll = getAll;
module.exports.markAsRead = markAsRead;
module.exports.deleteNot = deleteNot;
module.exports.getNotificationsOfUserRead = getNotificationsOfUserRead;
