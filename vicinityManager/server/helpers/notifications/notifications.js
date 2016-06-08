/**
 * Created by viktor on 01.04.16.
 */

var mongoose = require('mongoose');

var winston = require('winston');

var userAccountOp = require('../../models/vicinityManager').userAccount;
var userAccountOp2 = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;

function markAsRead(sender_id, recipient_id, type){
    notificationOp.find({sentBy: sender_id, addressedTo: {$in :[recipient_id]}, type: type, isUnread: true},
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

 notificationOp.find({addressedTo: o_id, isUnread: true}).populate('sentBy','avatar organisation').exec(function(err,data){
   response = {"error": false, "message": data};
  //  winston.log('debug','responding getNotificationsOfUser');
   res.json(response);

 });

}

module.exports.markAsRead = markAsRead;
module.exports.getNotificationsOfUser = getNotificationsOfUser;
