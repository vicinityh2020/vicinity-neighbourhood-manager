/*
Global variables and required packages
*/

var mongoose = require('mongoose');
var itemAPI = require('../items/put');
var notificationAPI = require('../../routes/notifications/notifications');             //my_id should be .cid everywhere
var logger = require("../../middlewares/logger");
var sharingRules = require('../../helpers/sharingRules');
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
var itemOp = require('../../models/vicinityManager').item;
var audits = require('../../routes/audit/put');

/*
Public Functions
*/

function processFriendRequest(req, res, next) {
  //TODO: Issue #6 check double requests;
  //TODO: Issue #6 check transactions;
    var friend_id = mongoose.Types.ObjectId(req.params.id);
    var my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
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
        friend.knowsRequestsFrom.push(my_id);
        me.knowsRequestsTo.push(friend_id);

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
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: true,
            eventType: 31 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: false,
            eventType: 31 }
        );

        // friend.hasNotifications.push(notification._id); // TODO CHECK IF NECESSARY
        friend.save();
        me.save();
        logger.audit({user: req.body.userMail, action: 'processFriendRequest', orgOrigin: my_id, orgDest: friend_id});
        res.json({"error": false, "message": "Friending successful!"});
      }
    ).catch(
      function(err){
        logger.error({user: req.body.userMail, action: 'processFriendRequest', message: err});
        res.json({"error": true, "message": "Error friending: " + err});
      }
    );
  }

function acceptFriendRequest(req, res, next) {
    //TODO: Issue #6 :id should have authenticated user as in request list.
    //TODO: Issue #6 update knows list on :id and authenticated user side.
    //TODO: Issue #6 create new friendship story.
    //TODO: Issue #6 update friendship counts.

    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
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

        friend.knows.push(my_id);
        me.knows.push(friend_id);

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
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: true,
            eventType: 33 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: false,
            eventType: 33 }
        );

        notificationAPI.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notificationAPI.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

        friend.save();
        me.save();
        logger.audit({user: req.body.userMail, action: 'acceptFriendRequest', orgOrigin: my_id, orgDest: friend_id});
        res.json({"error": false, "message": "Friending successful!"});
      }
    ).catch(
      function(err){
        logger.error({user: req.body.userMail, action: 'acceptFriendRequest', message: err});
        res.json({"error": true, "message": "Error friending: " + err});
      }
    );
  }

function rejectFriendRequest(req, res, next) {
    //TODO: Issue #6 remove :id from authenitcated user knows list
    //TODO: Issue #6 remove :autenticated user from :id's knows list
    //TODO: Issue #6 update friendship counts.

    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
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
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: true,
            eventType: 34 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: false,
            eventType: 34 }
        );

        notificationAPI.changeNotificationStatus(friend_id, my_id, 31); // responds partnership request from friend
        notificationAPI.changeNotificationStatus(my_id, friend_id, 31); // responds partnership request from me

        friend.save();
        me.save();
        logger.audit({user: req.body.userMail, action: 'rejectFriendRequest', orgOrigin: my_id, orgDest: friend_id});
        res.json({"error": false, "message": "Friending successful!"});
      }
    ).catch(
      function(err){
        logger.error({user: req.body.userMail, action: 'rejectFriendRequest', message: err});
        res.json({"error": true, "message": "Error friending: " + err});
      }
    );
  }

function cancelFriendRequest(req, res, next){

  friend_id = mongoose.Types.ObjectId(req.params.id);
  my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
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
        { orgOrigin: my_id,
          orgDest: friend_id,
          user: req.body.userMail,
          triggeredByMe: true,
          eventType: 32 }
      );

      audits.putAuditInt(
        friend_id,
        { orgOrigin: my_id,
          orgDest: friend_id,
          user: req.body.userMail,
          triggeredByMe: false,
          eventType: 32 }
      );

      friend.save();
      me.save();
      logger.audit({user: req.body.userMail, action: 'cancelFriendRequest', orgOrigin: my_id, orgDest: friend_id});
      res.json({"error": false, "message": "Friending successful!"});
    }
  ).catch(
    function(err){
      logger.error({user: req.body.userMail, action: 'cancelFriendRequest', message: err});
      res.json({"error": true, "message": "Error friending: " + err});
    }
  );
}


function cancelFriendship(req, res, next){

    // console.log("Running cancelation of friendship!");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
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

        // Removes all items with FRIEND access level from the contracts of the company I am breaking the friendship with
        sharingRules.removeFriend(my_id, friend_id);

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
            user: req.body.userMail,
            triggeredByMe: true,
            eventType: 35 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            triggeredByMe: false,
            eventType: 35 }
        );

        friend.save();
        me.save();
        logger.audit({user: req.body.userMail, action: 'cancelFriendship', orgOrigin: my_id, orgDest: friend_id});
        res.json({"error": false, "message": "Friending successful!"});
      }
    ).catch(
      function(err){
        logger.error({user: req.body.userMail, action: 'cancelFriendship', message: err});
        res.json({"error": true, "message": "Error friending: " + err});
      }
    );
}

/*
Private Functions
*/

var findAndRemove = function(array, value){
  for (var i = 0; i < array.length; i++) {
      if (array[i].toString() === value.toString()) {
          array.splice(i, 1);
      }
    }
    return array;
  };


/*
Export functions
*/

module.exports.processFriendRequest = processFriendRequest;
module.exports.acceptFriendRequest = acceptFriendRequest;
module.exports.rejectFriendRequest = rejectFriendRequest;
module.exports.cancelFriendRequest = cancelFriendRequest;
module.exports.cancelFriendship = cancelFriendship;
