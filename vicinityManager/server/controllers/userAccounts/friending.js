/*
Global variables and required packages
*/

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sFriending = require("../../services/organisations/friending");

/*
Public Functions
*/

function processFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.processFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
    } else {
      logger.log(req, res, {type: 'audit', data: {info: "Friend request sent", actor: my_mail}});
    }
    res.json({"error": err, "message": response});
  });
}

function acceptFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.acceptFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
    } else {
      logger.log(req, res, {type: 'audit', data: {info: "Friend request accepted", actor: my_mail}});
    }
    res.json({"error": err, "message": response});
  });
}

function rejectFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.rejectFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
    } else {
      logger.log(req, res, {type: 'audit', data: {info: "Friend request rejected", actor: my_mail}});
    }
    res.json({"error": err, "message": response});
  });
}

function cancelFriendRequest(req, res, next){
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.cancelFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
    } else {
      logger.log(req, res, {type: 'audit', data: {info: "Friend request cancelled", actor: my_mail}});
    }
    res.json({"error": err, "message": response});
  });
}


function cancelFriendship(req, res, next){
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.cancelFriendship(friend_id, my_id, my_mail, my_uid, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
    } else {
      logger.log(req, res, {type: 'audit', data: {info: "Cancel friend request", actor: my_mail}});
    }
    res.json({"error": err, "message": response});
  });
}

/*
Export functions
*/
module.exports.processFriendRequest = processFriendRequest;
module.exports.acceptFriendRequest = acceptFriendRequest;
module.exports.rejectFriendRequest = rejectFriendRequest;
module.exports.cancelFriendRequest = cancelFriendRequest;
module.exports.cancelFriendship = cancelFriendship;
