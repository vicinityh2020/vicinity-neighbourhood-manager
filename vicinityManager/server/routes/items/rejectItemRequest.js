var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;
var notificationAPI = require('../notifications/notifications');
var notificationOp = require('../../models/vicinityManager').notification;

function rejectItemRequest(req, res, next) {
    var index;
    console.log("Running accept data access request");
    dev_id = mongoose.Types.ObjectId(req.params.id);
    activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var device = {};
    var response = {};

    itemOp.find({_id: dev_id}, function (err, data) {
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 1) {

                var device = data[0];
                var friend_id = device.accessRequestFrom[device.accessRequestFrom.length-1];

                for (index = device.hasAccess.length - 1; index >= 0; index --) {
                     if (device.hasAccess[index].toString() === device.accessRequestFrom[0].toString()) {    //predpokladam, ze v accessRequestFrom moze byt len 1 request, nezmenit z pola na number?
                        device.hasAccess.splice(index, 1);
                     }
                }

                for (index = device.accessRequestFrom.length - 1; index >= 0; index --) {
                      device.accessRequestFrom.splice(index, 1);
                }

                var notification = new notificationOp();

                notification.addressedTo.push(friend_id);
                notification.sentBy = activeCompany_id;
                notification.type = 22;
                notification.status = 'info';
                notification.itemId = device._id;
                notification.isUnread = true;
                notification.save();

                device.save();

                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    });
}

module.exports.rejectItemRequest = rejectItemRequest;
