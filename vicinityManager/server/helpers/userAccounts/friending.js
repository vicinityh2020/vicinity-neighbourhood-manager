var mongoose = require('mongoose');

var userAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
//TODO: Issue #6  check that only :id can make friends.
//TODO: Issue #6 Send friendship notification to :id.
//TODO: Issue #6 check double requests;
//TODO: Issue #6 check transactions;
function processFriendRequest(req, res, next) {
    debugger;
    console.log("POST /:id/friendship");
    console.log(":id " + req.params.id);
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.context.id);
    var friend = {};
    var me = {};
    var response = {};
    userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        debugger;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {

                var me = {};
                var friend = {};
                for (var index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                friend.knowsRequestsFrom.push(my_id);
                me.knowsRequestsTo.push(friend_id);

                var notification = new notificationOp();

                notification.addressedTo.push(friend._id);
                notification.sentBy = me._id;
                notification.type = 'friendRequest';
                notification.isUnread = true;
                notification.save();

                friend.hasNotifications.push(notification._id);

                friend.save();
                me.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        res.json(response);
    });
}

module.exports.processFriendRequest = processFriendRequest;