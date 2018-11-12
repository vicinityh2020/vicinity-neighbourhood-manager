// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sFriending = require("../../services/organisations/friending");

/*
Friending --------------------------------------------------
*/

/**
 * Get friendship notifications
 *
 * @param null
 *
 * @return {Object} Friendship notifications
 */
exports.partnershipFeeds = function(req, res, next) {
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  sFriending.friendshipFeeds(my_id, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    if(!response) res.status(404);
    res.json({"error": err, "message": response});
  });
};

/**
 * Request friendship
 *
 * @param {String} friend_id
 *
 * @return {String} Acknowledgement
 */
exports.requestPartnership = function(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.body.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.friendshipStatus(my_id, friend_id.toString(), function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
      res.json({"error": true, "message": err });
    } else if(response.imFriend){
      res.status(400);
      logger.log(req, res, {type: 'warn', data: "You are already friend with " + friend_id});
      res.json({"error": false, "message": "You are already friend with " + friend_id });
    } else if(response.sentReq || response.haveReq){
      res.status(400);
      logger.log(req, res, {type: 'warn', data: "You already have an open friending process with " + friend_id});
      res.json({"error": false, "message": "You already have an open friending process with " + friend_id });
    } else {
      sFriending.processFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
        if(err){
          res.status(500);
          logger.log(req, res, {type: 'error', data: response});
        } else {
          logger.log(req, res, {action: 'audit', data: {info: "Friend request sent", actor: my_mail}});
        }
        res.json({"error": err, "message": response});
      });
    }
  });
};

/**
 * Manage friendships
 *
 * @param {String} friend_id
 * @param {String} type
 *
 * @return {String} Acknowledgement
 */
exports.managePartnership = function(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.body.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  var type = req.body.type;
  sFriending.friendshipStatus(my_id, friend_id.toString(), function(err, response){
    if(err){
      res.status(500);
      res.json({"error": true, "message": err });
    } else {
      switch(type) {
        case "accept":
            if(response.haveReq){
              sFriending.acceptFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                if(err){
                  logger.log(req, res, {type: 'error', data: response});
                } else {
                  logger.log(req, res, {action: 'audit', data: {info: "Friend request accepted", actor: my_mail}});
                }
                res.json({"error": err, "message": response});
              });
            } else {
              res.status(400);
              logger.log(req, res, {type: 'warn', data: "You do not have friend requests from " + friend_id});
              res.json({"error": false, "message": "You do not have friend requests from " + friend_id});
            }
            break;
        case "reject":
          if(response.haveReq){
              sFriending.rejectFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                if(err){
                  res.status(500);
                  logger.log(req, res, {type: 'error', data: response});
                } else {
                  logger.log(req, res, {action: 'audit', data: {info: "Friend request rejected", actor: my_mail}});
                }
                res.json({"error": err, "message": response});
              });
            } else {
              res.status(400);
              logger.log(req, res, {type: 'warn', data: "You do not have friend requests from " + friend_id});
              res.json({"error": false, "message": "You do not have friend requests from " + friend_id});
            }
            break;
        case "cancelRequest":
            if(response.sentReq){
              sFriending.cancelFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                if(err){
                  res.status(500);
                  logger.log(req, res, {type: 'error', data: response});
                } else {
                  logger.log(req, res, {action: 'audit', data: {info: "Friend request cancelled", actor: my_mail}});
                }
                res.json({"error": err, "message": response});
              });
            } else {
              res.status(403);
              logger.log(req, res, {type: 'warn', data: "You have not sent requests to " + friend_id});
              res.json({"error": false, "message": "You have not sent requests to " + friend_id});
            }
            break;
        case "cancel":
            if(response.imFriend){
              sFriending.cancelFriendship(friend_id, my_id, my_mail, my_uid, function(err, response){
                if(err){
                  res.status(500);
                  logger.log(req, res, {type: 'error', data: response});
                } else {
                  logger.log(req, res, {action: 'audit', data: {info: "Cancel friend request", actor: my_mail}});
                }
                res.json({"error": err, "message": response});
              });
            } else {
              res.status(400);
              logger.log(req, res, {type: 'warn', data: "You do not have a friendship with " + friend_id});
              res.json({"error": false, "message": "You do not have a friendship with " + friend_id});
            }
            break;
        default:
          res.status(400);
          logger.log(req, res, {type: 'warn', data: "Wrong type"});
          res.json({"error": false, "message": "Wrong type"});
          break;
        }
      }
    });
  };
