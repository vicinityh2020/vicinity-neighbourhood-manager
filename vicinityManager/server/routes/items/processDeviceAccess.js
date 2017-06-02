var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;
var userAccountOp = require('../../models/vicinityManager').userAccount;

function processDeviceAccess(req, res, next) {
    console.log("PUT /:id/access");
    console.log(":id " + req.params.id);
    dev_id = mongoose.Types.ObjectId(req.params.id);
    activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var device = {};
    var response = {};

    itemOp.find({_id: dev_id}).populate('hasAdministrator','organisation').exec(function (err, data) {
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 1) {

                var device = data[0];
                var friend_id = device.hasAdministrator[0]._id;

                device.accessRequestFrom.push(activeCompany_id);

                var notification = new notificationOp();

                notification.addressedTo.push(friend_id);      //friend_id     data.hasAdministrator[0]._id
                notification.sentBy = activeCompany_id;
                notification.type = 'deviceRequest';
                notification.status = 'waiting';
                notification.deviceId = dev_id;
                notification.isUnread = true;
                notification.save();

                // userAccountOp.findOne({_id: friend_id},function(err2,data2){
                //   data2.hasNotifications.push(notification._id);
                // });

                device.save();

                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        res.json(response);
    });
}

module.exports.processDeviceAccess = processDeviceAccess;
