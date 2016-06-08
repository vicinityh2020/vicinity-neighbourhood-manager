var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;
var notificationAPI = require('../notifications/notifications');
var notificationOp = require('../../models/vicinityManager').notification;

function rejectDeviceRequest(req, res, next) {

    console.log("Running accept data access request");
    dev_id = mongoose.Types.ObjectId(req.params.id);
    activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.context.cid);
    var device = {};
    var response = {};

    itemOp.find({_id: dev_id}, function (err, data) {
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 1) {

                var device = data[0];
                var friend_id = device.accessRequestFrom[device.accessRequestFrom.length-1];

                for (var index = device.hasAccess.length - 1; index >= 0; index --) {
                     if (device.hasAccess[index].toString() === device.accessRequestFrom[0].toString()) {    //predpokladam, ze v accessRequestFrom moze byt len 1 request, nezmenit z pola na number?
                        device.hasAccess.splice(index, 1);
                     }
                };

                for (var index = device.accessRequestFrom.length - 1; index >= 0; index --) {
                    // if (device.accessRequestFrom[index].toString() === activeCompany_id.toString()) {    neviem identifikovat od koho dosiel reques, pre demo je postacujuce ak vymazem cele pole
                        device.accessRequestFrom.splice(index, 1);
                    // }
                };

                notificationAPI.changeStatusToResponded(friend_id,activeCompany_id,'deviceRequest','waiting');

                // var notification = new notificationOp();
                //
                // notification.addressedTo.push(friend_id);
                // notification.sentBy = activeCompany_id;
                // notification.type = 'deviceRequest';
                // notification.status = 'accepted';
                // notification.data.deviceId = device._id;
                // notification.isUnread = true;
                // notification.save();

                // notificationAPI.markAsRead(friend_id, my_id, "friendRequest");

                device.save();

                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    });
}

module.exports.rejectDeviceRequest = rejectDeviceRequest;
