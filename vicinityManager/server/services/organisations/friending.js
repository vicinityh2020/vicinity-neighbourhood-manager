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
  var doAsync = [];
  doAsync.push(companyAccountOp.findOne({"_id": my_id}, {cid: 1}));
  doAsync.push(companyAccountOp.findOne({"_id": friend_id}, {cid: 1}));
  Promise.all(doAsync)
    .then( function(response){
      me = response[0];
      friend = response[1];
      doAsync = [];
      doAsync.push(companyAccountOp.update({_id: friend_id}, { $push: { knowsRequestsFrom: {'id': my_id, 'extid': me.cid } } }));
      doAsync.push(companyAccountOp.update({_id: my_id}, { $push: { knowsRequestsTo: {'id': friend_id, 'extid': friend.cid } } }));
      doAsync.push(notifHelper.createNotification(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        'waiting', 31, null));
      doAsync.push(notifHelper.createNotification(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        'info', 35, null));
      doAsync.push(audits.create(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        31, null));
      return Promise.all(doAsync);
    })
    .then(function(response){
      callback(false, "Friend request sent");
    })
    .catch(function(err){
      callback(true, err);
    });
  }

function acceptFriendRequest(friend_id, my_id, my_mail, my_uid, callback) {
  var me, friend;
  var doAsync = [];
  doAsync.push(companyAccountOp.findOne({"_id": my_id}, {cid: 1}));
  doAsync.push(companyAccountOp.findOne({"_id": friend_id}, {cid: 1}));
  Promise.all(doAsync)
    .then( function(response){
      me = response[0];
      friend = response[1];
      doAsync = [];
      doAsync.push(companyAccountOp.update({_id: friend_id}, { $push: { knows: {'id': my_id, 'extid': me.cid } } }));
      doAsync.push(companyAccountOp.update({_id: my_id}, { $push: { knows: {'id': friend_id, 'extid': friend.cid } } }));
      doAsync.push(companyAccountOp.update({_id: friend_id}, { $pull: { knowsRequestsTo: {'id': my_id, 'extid': me.cid } } }));
      doAsync.push(companyAccountOp.update({_id: my_id}, { $pull: { knowsRequestsFrom: {'id': friend_id, 'extid': friend.cid } } }));
      doAsync.push(notifHelper.createNotification(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        'accepted', 34, null));
      doAsync.push(audits.create(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        33, null));
      doAsync.push(notifHelper.changeNotificationStatus(friend_id, my_id, 31)); // responds partnership request from friend
      doAsync.push(notifHelper.changeNotificationStatus(my_id, friend_id, 31)); // responds partnership request from me
      return Promise.all(doAsync);
    })
    .then(function(response){
      callback(false, "Friendship accepted");
    })
    .catch(
      function(err){
        callback(true, err);
      }
    );
  }

function rejectFriendRequest(friend_id, my_id, my_mail, my_uid, callback) {
    var me, friend;
    var doAsync = [];
    doAsync.push(companyAccountOp.findOne({"_id": my_id}, {cid: 1}));
    doAsync.push(companyAccountOp.findOne({"_id": friend_id}, {cid: 1}));
    Promise.all(doAsync)
      .then( function(response){
        me = response[0];
        friend = response[1];
        doAsync = [];
        doAsync.push(companyAccountOp.update({_id: friend_id}, { $pull: { knowsRequestsTo: {'id': my_id, 'extid': me.cid } } }));
        doAsync.push(companyAccountOp.update({_id: my_id}, { $pull: { knowsRequestsFrom: {'id': friend_id, 'extid': friend.cid } } }));
        doAsync.push(notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          'rejected', 33, null));
        doAsync.push(audits.create(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          34, null));
        doAsync.push(notifHelper.changeNotificationStatus(friend_id, my_id, 31)); // responds partnership request from friend
        doAsync.push(notifHelper.changeNotificationStatus(my_id, friend_id, 31)); // responds partnership request from me
        return Promise.all(doAsync);
      })
      .then(
        function(response){callback(false, "Friendship rejected");
      })
      .catch(function(err){
        callback(true, err);
      });
  }


function cancelFriendRequest(friend_id, my_id, my_mail, my_uid, callback){
  var me, friend;
  var doAsync = [];
  doAsync.push(companyAccountOp.findOne({"_id": my_id}, {cid: 1}));
  doAsync.push(companyAccountOp.findOne({"_id": friend_id}, {cid: 1}));
  Promise.all(doAsync)
    .then( function(response){
      me = response[0];
      friend = response[1];
      doAsync = [];
      doAsync.push(companyAccountOp.update({_id: friend_id}, { $pull: { knowsRequestsFrom: {'id': my_id, 'extid': me.cid } } }));
      doAsync.push(companyAccountOp.update({_id: my_id}, { $pull: { knowsRequestsTo: {'id': friend_id, 'extid': friend.cid } } }));
      doAsync.push(audits.create(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        32, null));
      doAsync.push(notifHelper.changeNotificationStatus(friend_id, my_id, 31)); // responds partnership request from friend
      doAsync.push(notifHelper.changeNotificationStatus(my_id, friend_id, 31)); // responds partnership request from me
      Promise.all(doAsync);
    })
    .then(function(response){
      callback(false, "Friendship request cancelled");
    })
    .catch(function(err){
      callback(true, err);
    });
  }


function cancelFriendship(friend_id, my_id, my_mail, my_uid, callback){
    var me, friend;
    var doAsync = [];
    doAsync.push(companyAccountOp.findOne({"_id": my_id}, {cid: 1}));
    doAsync.push(companyAccountOp.findOne({"_id": friend_id}, {cid: 1}));
    Promise.all(doAsync)
      .then( function(response){
        me = response[0];
        friend = response[1];
        doAsync = [];
        doAsync.push(companyAccountOp.update({_id: friend_id}, { $pull: { knows: {'id': my_id, 'extid': me.cid } } }));
        doAsync.push(companyAccountOp.update({_id: my_id}, { $pull: { knows: {'id': friend_id, 'extid': friend.cid } } }));
        doAsync.push(sharingRules.removeFriend(my_id, friend_id, my_mail, my_uid));
        doAsync.push(notifHelper.createNotification(
        { kind: 'user', item: my_uid , extid: my_mail },
        { kind: 'userAccount', item: friend._id, extid: friend.cid },
        { kind: 'userAccount', item: me._id, extid: me.cid },
        'info', 32, null));
        doAsync.push(notifHelper.createNotification(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          'info', 32, null));
        doAsync.push(audits.create(
          { kind: 'user', item: my_uid , extid: my_mail },
          { kind: 'userAccount', item: me._id, extid: me.cid },
          { kind: 'userAccount', item: friend._id, extid: friend.cid },
          35, null));
        return Promise.all(doAsync);
      })
      .then( function(response){
        callback(false, "Friendship cancelled");
      })
      .catch( function(err){
        callback(true, err);
      });
}

function friendshipFeeds(my_id, callback){
  companyAccountOp.findOne({_id: my_id}, {knowsRequestsTo:1, knowsRequestsFrom:1})
  .populate('knowsRequestsTo.id', 'name')
  .populate('knowsRequestsFrom.id', 'name')
  .lean()
  .then(function(response){
    var myFeeds = response;
    var feeds = {};
    feeds.requestsReceived = myFeeds.knowsRequestsFrom;
    feeds.sentRequests = myFeeds.knowsRequestsTo;
    if(feeds.requestsReceived.length + feeds.sentRequests.length > 0){
      callback(false, feeds);
    } else {
      // No friendship requests found
      callback(false, false);
    }
  })
  .catch(function(err){
    callback(true, err);
  });
}

function friendshipStatus(my_id, friend_id, callback){
  var finalResponse = {};
  companyAccountOp.findOne({"_id": my_id}, {knows:1, knowsRequestsTo:1, knowsRequestsFrom:1}).lean()
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
