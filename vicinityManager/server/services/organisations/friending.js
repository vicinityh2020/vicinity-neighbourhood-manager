/*
Global variables and required packages
*/

var mongoose = require('mongoose');
var itemAPI = require('../../controllers/items/put');
var logger = require("../../middlewares/logger");
var sharingRules = require('../../services/sharingRules');
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var itemOp = require('../../models/vicinityManager').item;
var notifHelper = require('../../services/notifications/notificationsHelper');
var audits = require('../../services/audit/audit');

/*
Public Functions
*/

function processFriendRequest(friend_id, my_id, my_mail, my_uid, callback) {
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

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          'waiting', 31, null);

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          'info', 35, null);

        audits.create(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          31, null);

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

function acceptFriendRequest(friend_id, my_id, my_mail, my_uid, callback) {
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

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          'accepted', 34, null);

        audits.create(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          33, null);

        notifHelper.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notifHelper.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

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

function rejectFriendRequest(friend_id, my_id, my_mail, my_uid, callback) {
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

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          'rejected', 33, null);

        audits.create(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          34, null);

        notifHelper.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notifHelper.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

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

function cancelFriendRequest(friend_id, my_id, my_mail, my_uid, callback){
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

      notifHelper.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
      notifHelper.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

      // var notification = new notificationOp();
      //
      // notification.addressedTo = [friend_id, my_id];
      // notification.sentBy = my_id;
      // notification.type = 36;
      // notification.status = 'info';
      // notification.isUnread = true;
      // notification.save();

      audits.create(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        32, null);

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


function cancelFriendship(friend_id, my_id, my_mail, my_uid, callback){
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
        .then( function(response){ return sharingRules.removeFriend(my_id, friend_id, my_mail, my_uid); })
        .then( function(response){ logger.debug('out: ' + JSON.stringify(response)); })
        .catch( function(err){ logger.debug('Error: ' + err); });

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          'info', 32, null);

        notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          'info', 32, null);

          audits.create(
            { kind: 'user', item: my_uid , extid: my_mail },
            { kind: 'userAccount', item: me._id, extid: me.cid },
            { kind: 'userAccount', item: friend._id, extid: friend.cid },
            35, null);

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
  companyAccountOp.findOne({_id: my_id}, {knowsRequestsTo:1, knowsRequestsFrom:1}).populate('knowsRequestsTo.id', 'name').populate('knowsRequestsFrom.id', 'name')
  .then(function(response){
    var myFeeds = response.toObject();
    var feeds = {};
    feeds.requestsReceived = myFeeds.knowsRequestsFrom;
    feeds.sentRequests = myFeeds.knowsRequestsTo;
    callback(false, feeds);
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
