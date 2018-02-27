/*
Global variables and required packages
*/

var mongoose = require('mongoose');
var itemAPI = require('../../controllers/items/put');
var notificationAPI = require('../../controllers/notifications/notifications');             //my_id should be .cid everywhere
var logger = require("../../middlewares/logger");
var sharingRules = require('../../services/sharingRules');
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
var itemOp = require('../../models/vicinityManager').item;
var audits = require('../../controllers/audit/put');

/*
Public Functions
*/

function processFriendRequest(friend_id, my_id, my_mail, callback) {
    var me, friend;
    companyAccountOp.findById(my_id)
    .then(
      function(response){
        me = response;
        return companyAccountOp.findById(friend_id);
      }
    ).then(
      function(response){
        friend = response;
        friend.knowsRequestsFrom.push({'id': my_id, 'extid': me.cid });
        me.knowsRequestsTo.push({'id': friend_id, 'extid': friend.cid });

        var notification_1 = new notificationOp();
        notification_1.addressedTo.push(friend._id);
        notification_1.sentBy = me._id;
        notification_1.type = 31;
        notification_1.status = 'waiting';
        notification_1.save();

        var notification_2 = new notificationOp();
        notification_2.addressedTo.push(me._id);
        notification_2.sentBy = friend._id;
        notification_2.type = 35;
        notification_2.status = 'info';
        notification_2.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: true,
            eventType: 31 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: false,
            eventType: 31 }
        );

        // friend.hasNotifications.push(notification._id); // TODO CHECK IF NECESSARY
        friend.save();
        me.save();
        logger.audit({user: my_mail, action: 'processFriendRequest', orgOrigin: {'id': my_id, 'extid': me.cid }, orgDest: {'id': friend_id, 'extid': friend.cid }});
        callback(false, "Friend request sent");
      }
    ).catch(
      function(err){
        logger.error({user: my_mail, action: 'processFriendRequest', message: err});
        callback(true, err);
      }
    );
  }

function acceptFriendRequest(friend_id, my_id, my_mail, callback) {
    var me, friend;

    companyAccountOp.findById(my_id)
    .then(
      function(response){
        me = response;
        return companyAccountOp.findById(friend_id);
      }
    ).then(
      function(response){
        friend = response;
        friend.knows.push({'id': my_id, 'extid': me.cid });
        me.knows.push({'id': friend_id, 'extid': friend.cid });

        // Removes friend from my org knows, knowRqstFrom or knowRqstTo
        friend.knowsRequestsTo = findAndRemove(friend.knowsRequestsTo, my_id);
        me.knowsRequestsFrom = findAndRemove(me.knowsRequestsFrom, friend_id);

        var notification = new notificationOp();

        notification.addressedTo.push(friend_id);
        notification.sentBy = my_id;
        notification.type = 34;
        notification.status = 'info';
        notification.isUnread = true;
        notification.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: true,
            eventType: 33 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: false,
            eventType: 33 }
        );

        notificationAPI.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notificationAPI.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

        friend.save();
        me.save();
        logger.audit({user: my_mail, action: 'acceptFriendRequest', orgOrigin: {'id': my_id, 'extid': me.cid }, orgDest: {'id': friend_id, 'extid': friend.cid }});
        callback(false, "Friendship accepted");
      }
    ).catch(
      function(err){
        logger.error({user: my_mail, action: 'acceptFriendRequest', message: err});
        callback(true, err);
      }
    );
  }

function rejectFriendRequest(friend_id, my_id, my_mail, callback) {
    var me, friend;

    companyAccountOp.findById(my_id)
    .then(
      function(response){
        me = response;
        return companyAccountOp.findById(friend_id);
      }
    ).then(
      function(response){
        friend = response;

        // Removes friend from my org knows, knowRqstFrom or knowRqstTo
        friend.knowsRequestsTo = findAndRemove(friend.knowsRequestsTo, my_id);
        me.knowsRequestsFrom = findAndRemove(me.knowsRequestsFrom, friend_id);

        var notification = new notificationOp();

        notification.addressedTo.push(friend_id);
        notification.sentBy = my_id;
        notification.type = 33;
        notification.status = 'rejected';
        notification.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: true,
            eventType: 34 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: {'id': my_id, 'extid': me.cid },
            orgDest: {'id': friend_id, 'extid': friend.cid },
            user: my_mail,
            triggeredByMe: false,
            eventType: 34 }
        );

        notificationAPI.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notificationAPI.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

        friend.save();
        me.save();
        logger.audit({user: my_mail, action: 'rejectFriendRequest', orgOrigin: {'id': my_id, 'extid': me.cid }, orgDest: {'id': friend_id, 'extid': friend.cid }});
        callback(false, "Friendship rejected");
      }
    ).catch(
      function(err){
        logger.error({user: my_mail, action: 'rejectFriendRequest', message: err});
        callback(true, err);
      }
    );
  }

function cancelFriendRequest(friend_id, my_id, my_mail, callback){
  var me, friend;

  companyAccountOp.findById(my_id)
  .then(
    function(response){
      me = response;
      return companyAccountOp.findById(friend_id);
    }
  ).then(
    function(response){
      friend = response;

      // Removes friend from my org knows, knowRqstFrom or knowRqstTo
      friend.knowsRequestsFrom = findAndRemove(friend.knowsRequestsFrom, my_id);
      me.knowsRequestsTo = findAndRemove(me.knowsRequestsTo, friend_id);

      notificationAPI.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
      notificationAPI.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

      // var notification = new notificationOp();
      //
      // notification.addressedTo = [friend_id, my_id];
      // notification.sentBy = my_id;
      // notification.type = 36;
      // notification.status = 'info';
      // notification.isUnread = true;
      // notification.save();

      audits.putAuditInt(
        my_id,
        { orgOrigin: {'id': my_id, 'extid': me.cid },
          orgDest: {'id': friend_id, 'extid': friend.cid },
          user: my_mail,
          triggeredByMe: true,
          eventType: 32 }
      );

      audits.putAuditInt(
        friend_id,
        { orgOrigin: {'id': my_id, 'extid': me.cid },
          orgDest: {'id': friend_id, 'extid': friend.cid },
          user: my_mail,
          triggeredByMe: false,
          eventType: 32 }
      );

      friend.save();
      me.save();
      logger.audit({user: my_mail, action: 'cancelFriendRequest', orgOrigin: {'id': my_id, 'extid': me.cid }, orgDest: {'id': friend_id, 'extid': friend.cid }});
      callback(false, "Friendship request cancelled");
    }
  ).catch(
    function(err){
      logger.error({user: my_mail, action: 'cancelFriendRequest', message: err});
      callback(true, err);
    }
  );
}


function cancelFriendship(friend_id, my_id, my_mail, callback){
    var me, friend;

    companyAccountOp.findById(my_id)
    .then(
      function(response){
        me = response;
        return companyAccountOp.findById(friend_id);
      }
    ).then(
      function(response){
        friend = response;

        // Removes friend from my org knows, knowRqstFrom or knowRqstTo
        friend.knows = findAndRemove(friend.knows, my_id);
        me.knows = findAndRemove(me.knows, friend_id);

        friend.save()
        .then( function(response){ return me.save(); })
        .then( function(response){ return sharingRules.removeFriend(my_id, friend_id, my_mail); })
        .then( function(response){ logger.debug('out: ' + response); })
        .catch( function(err){ logger.debug('Error: ' + err); });

        var notification = new notificationOp();

        notification.addressedTo = [friend_id, my_id];
        notification.sentBy = my_id;
        notification.type = 32;
        notification.status = 'info';
        notification.isUnread = true;
        notification.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: my_mail,
            triggeredByMe: true,
            eventType: 35 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: my_mail,
            triggeredByMe: false,
            eventType: 35 }
        );

        logger.audit({user: my_mail, action: 'cancelFriendship', orgOrigin: my_id, orgDest: friend_id});
        callback(false, "Friendship cancelled");
      }
    ).catch(
      function(err){
        logger.error({user: my_mail, action: 'cancelFriendship', message: err});
        callback(true, err);
      }
    );
}


function friendshipFeeds(my_id, callback){
  notificationOp.find({type: 31, addressedTo: {$in : [my_id]}, $or: [{isUnread: true}, {status: 'waiting'}]}, {addressedTo:1, sentBy:1}).populate('sentBy','avatar name')
  .then(function(response){
    callback(false, response);
  })
  .catch(function(err){
    callback(true, err);
  });
}

function friendshipStatus(my_id, friend_id, callback){
  var finalResponse = {};
  companyAccountOp.findById(my_id, {knows:1, knowsRequestsTo:1, knowsRequestsFrom:1})
  .then(function(response){
    var knows = [];
    var knowsRequestsTo = [];
    var knowsRequestsFrom = [];
    getIds(response.knows, knows);
    getIds(response.knowsRequestsTo, knowsRequestsTo);
    getIds(response.knowsRequestsFrom, knowsRequestsFrom);
    finalResponse.imFriend = (knows.indexOf(friend_id) !== -1);
    finalResponse.sentReq = (knowsRequestsTo.indexOf(friend_id) !== -1);
    finalResponse.haveReq = (knowsRequestsFrom.indexOf(friend_id) !== -1);
    callback(false, finalResponse);
  })
  .catch(function(err){
    callback(true, err);
  });
}

/*
Private Functions
*/

var findAndRemove = function(array, value){
  for (var i = 0; i < array.length; i++) {
      if (array[i].id.toString() === value.toString()) {
        array.splice(i, 1);
      }
    }
    return array;
  };

  function getIds(array, things){
    for(var i = 0; i < array.length; i++){
      things.push(array[i].id.toString());
    }
  }

/*
Export functions
*/

module.exports.processFriendRequest = processFriendRequest;
module.exports.acceptFriendRequest = acceptFriendRequest;
module.exports.rejectFriendRequest = rejectFriendRequest;
module.exports.cancelFriendRequest = cancelFriendRequest;
module.exports.cancelFriendship = cancelFriendship;
module.exports.friendshipFeeds = friendshipFeeds;
module.exports.friendshipStatus = friendshipStatus;
