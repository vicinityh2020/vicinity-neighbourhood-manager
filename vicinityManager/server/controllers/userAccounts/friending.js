/*
Global variables and required packages
*/

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sFriending = require("../../services/organisations/friending");

/*
Public Functions
*/

function processFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.processFriendRequest(friend_id, my_id, my_mail, function(err, response){
    res.json({"error": err, "message": response});
  });
}

function acceptFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.acceptFriendRequest(friend_id, my_id, my_mail, function(err, response){
    res.json({"error": err, "message": response});
  });
}

function rejectFriendRequest(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.rejectFriendRequest(friend_id, my_id, my_mail, function(err, response){
    res.json({"error": err, "message": response});
  });
}

function cancelFriendRequest(req, res, next){
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.cancelFriendRequest(friend_id, my_id, my_mail, function(err, response){
    res.json({"error": err, "message": response});
  });
}


function cancelFriendship(req, res, next){
  var friend_id = mongoose.Types.ObjectId(req.params.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.cancelFriendship(friend_id, my_id, my_mail, function(err, response){
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
