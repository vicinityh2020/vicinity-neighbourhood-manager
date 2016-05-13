var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;

function processDeviceAccess(req, res, next) {
    console.log("PUT /:id/access");
    console.log(":id " + req.params.id);
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

                device.accessRequestFrom.push(activeCompany_id);

                // var notification = new notificationOp();

                // notification.addressedTo.push(friend._id);
                // notification.sentBy = me._id;
                // notification.type = 'friendRequest';
                // notification.isUnread = true;
                // notification.save();
                //
                // friend.hasNotifications.push(notification._id);

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
