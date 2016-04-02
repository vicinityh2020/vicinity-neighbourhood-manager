/**
 * Created by viktor on 01.04.16.
 */

var mongoose = require('mongoose');

var notificationOp = require('../../models/vicinityManager').notification;

function markAsRead(sender_id, recipient_id, type){
    notificationOp.find({sentBy: sender_id, addressedTo: {$in :[recipient_id]}, type: type, isUnread: true},
        processFoundUnreadNotifications);
}

function processFoundUnreadNotifications(err, data){
    debugger;
    for (var index in data){
        var item = data[index];
        item.isUnread = false;
        item.save();
    }
}

module.exports.markAsRead = markAsRead;