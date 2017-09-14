var mongoose = require('mongoose');
var itemAPI = require('../items/put');
var notificationAPI = require('../../routes/notifications/notifications');             //my_id should be .cid everywhere
var logger = require("../../middlewares/logger");
var sharingRules = require('../../helpers/sharingRules');
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
var itemOp = require('../../models/vicinityManager').item;

//TODO rework whole module
//TODO: Issue #6  check that only :id can make friends.
//TODO: Issue #6 Send friendship notification to :id.
//TODO: Issue #6 check double requests;
//TODO: Issue #6 check transactions;

function processFriendRequest(req, res, next) {
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var response = {};
    companyAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
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
                notification.type = 31;
                notification.status = 'waiting';
                notification.isUnread = true;

                notification.save(
                  function(err,data){
                    if(data){
                      friend.hasNotifications.push(notification._id);
                      friend.save();
                      me.save();
                    }
                  }
                );

                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        res.json(response);
    });
}

function acceptFriendRequest(req, res, next) {
    //TODO: Issue #6 :id should have authenticated user as in request list.
    //TODO: Issue #6 update knows list on :id and authenticated user side.
    //TODO: Issue #6 create new friendship story.
    //TODO: Issue #6 update friendship counts.

    // console.log("Running accept friend request");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

    companyAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        var index;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {
                var me = {};
                var friend = {};
                for (index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                friend.knows.push(my_id);
                me.knows.push(friend_id);

                for (index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
                    if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
                        friend.knowsRequestsTo.splice(index, 1);
                    }
                }

                for (index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
                    if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
                        me.knowsRequestsFrom.splice(index,1);
                    }
                }

                sharingRules.newFriend(my_id, friend_id); // Adds all my items flagged for friends to my friend foreign group and viceversa

                // notificationAPI.markAsRead(friend_id, my_id, "friendRequest");
                // notificationAPI.changeStatusToResponded(friend_id, my_id, 'friendRequest','waiting');
                // notificationAPI.markAsRead(friend_id, my_id, 'friendRequest','waiting');

                var notification = new notificationOp();

                notification.addressedTo.push(friend_id);
                notification.sentBy = my_id;
                notification.type = 34;
                notification.status = 'accepted';
                notification.isUnread = true;
                notification.save();

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

function rejectFriendRequest(req, res, next) {
    //TODO: Issue #6 remove :id from authenitcated user knows list
    //TODO: Issue #6 remove :autenticated user from :id's knows list
    //TODO: Issue #6 update friendship counts.

    //TODO revise function, whole module in general!!

    // console.log("Running reject friend request");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

    companyAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        var index;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {
                var me = {};
                var friend = {};
                for (index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                for (index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
                    if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
                        friend.knowsRequestsTo.splice(index, 1);
                    }
                }

                for (index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
                    if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
                        me.knowsRequestsFrom.splice(index,1);
                    }
                }

                // notificationAPI.markAsRead(friend_id, my_id, "friendRequest");

                notificationAPI.changeStatusToResponded(friend_id,my_id,'friendRequest','waiting');
                notificationAPI.markAsRead(friend_id, my_id, 'friendRequest','waiting');

                var notification = new notificationOp();

                notification.addressedTo.push(friend_id);
                notification.sentBy = my_id;
                notification.type = 33;
                notification.status = 'rejected';
                notification.isUnread = true;
                notification.save();

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

function cancelFriendRequest(req, res, next){

    // console.log("Running cancelation of friend request!");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

    companyAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        var index;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {
                var me = {};
                var friend = {};
                for (index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                for (index = friend.knowsRequestsFrom.length - 1; index >= 0; index --) {
                    if (friend.knowsRequestsFrom[index].toString() === my_id.toString()) {
                        friend.knowsRequestsFrom.splice(index, 1);
                    }
                }

                for (index = me.knowsRequestsTo.length - 1; index >= 0; index --) {
                    if (me.knowsRequestsTo[index].toString() === friend_id.toString()) {
                        me.knowsRequestsTo.splice(index,1);
                    }
                }

                // notificationAPI.markAsRead(my_id, friend_id, "friendRequest");
                notificationAPI.deleteNot(my_id, friend_id, 'friendRequest', 'waiting');

                var notification = new notificationOp();

                notification.addressedTo.push(friend_id);
                notification.sentBy = my_id;
                notification.type = 32;
                notification.status = 'info';
                notification.isUnread = true;
                notification.save();

                friend.save();
                me.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    }
  );
}


function cancelFriendship(req, res, next){

    // console.log("Running cancelation of friendship!");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);             //wtf, not cid??

    companyAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {

                var me = {};
                var friend = {};

                var index = 0;
                for (index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                var i = 0;
                for (i = 0; i < friend.knows.length; i++) {
                    if (friend.knows[i].toString() === my_id.toString()) {
                        friend.knows.splice(i, 1);
                    }
                }

                var j = 0;
                for (j = 0; j < me.knows.length; j++) {
                    if (me.knows[j].toString() === friend_id.toString()) {
                        me.knows.splice(j, 1);
                    }
                }

                sharingRules.removeFriend(my_id, friend_id);  // Removes all my items from my friend foreign group and viceversa

                notificationAPI.deleteNot(my_id, friend_id, 'friendRequest', 'accepted');
                notificationAPI.deleteNot(friend_id, my_id, 'friendRequest', 'accepted');

                notificationAPI.deleteNot(my_id, friend_id, 'deviceRequest', 'waiting');
                notificationAPI.deleteNot(friend_id, my_id, 'deviceRequest', 'waiting');

                notificationAPI.markAsRead(my_id, friend_id, 'deviceRequest', 'accepted');
                notificationAPI.markAsRead(friend_id, my_id, 'deviceRequest', 'accepted');

                friend.save();
                me.save();

                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    }
  );
}

// Export functions
module.exports.processFriendRequest = processFriendRequest;
module.exports.acceptFriendRequest = acceptFriendRequest;
module.exports.rejectFriendRequest = rejectFriendRequest;
module.exports.cancelFriendRequest = cancelFriendRequest;
module.exports.cancelFriendship = cancelFriendship;
