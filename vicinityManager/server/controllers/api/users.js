// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var userOp = require("../../models/vicinityManager").user;

var sGetUser = require("../../services/users/getUsers");
var sInviteUser = require("../../services/invitations/invitations.js");
var sPutUser = require('../../services/users/putUsers');
var delUser = require('../../services/users/deleteUsers');
var sGetItems = require("../../services/items/get");

/*
Users --------------------------------------------------
*/

exports.getUser = function(req, res, next) {
  sGetUser.getUserInfo(req, res, function(err, response){
    if(err) {
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
    }
    if(!Object.keys(response).length) res.status(404);
    res.json({error: err, message: response});
  });
};

/**
 * Get user items
 *
 * @param {String} uid
 * @param {String} cid
 * @param {String} type (query)
 * @return {Object} Array of items
 */
exports.getUserItems = function(req, res, next) {
  var reqId = mongoose.Types.ObjectId(req.params.uid);
  var reqCid = mongoose.Types.ObjectId(req.params.cid);
  var myCid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = (req.query.type === undefined || (req.query.type !== "device" && req.query.type !== "service")) ? "all" : req.query.type;
  sGetItems.getUserItems(reqId, reqCid, myCid, type, function(err, response){
    if(err) {
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
    }
    res.json({error: err, message: response});
  });
};

/**
 * Invites a user
 *
 * @param {Object} data
 * organisation, emailTo, nameTo
 * @return {String} Acknowledgement
 */
exports.createUser = function(req, res, next) {
  req.body.type = "newUser";
  if(!req.body.organisation || !req.body.emailTo || !req.body.nameTo){
    res.status(400);
    res.json({"error": false, "message": "Missing fields to create invitation"});
  } else {
    sInviteUser.postOne(req, res, function(err, response){
      if(err){
        res.status(500);
        logger.log(req, res, {type:'error', data: response});
      } else {
        res.status(200);
        logger.log(req, res, {type:'audit', data: response});
      }
      res.json({"error": err, "message": response});
    });
  }
};

/**
 * Update a user
 *
 * @param {String} uid
 * @param {Object} Data and type
 *
 * @return {String} Acknowledgement
 */
exports.updateUser = function(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.uid);
  var updates = req.body.data;
  var userMail = req.body.decoded_token.sub;
  var userId = req.body.decoded_token.uid;
  var roles = req.body.decoded_token.roles;
  var cid = req.body.decoded_token.cid;
  var type = req.body.type;

  userOp.findOne({_id:o_id}, {email:1, cid:1}, function(err, response){
    if(err){
      res.status(500);
      res.json({error: true, message: err, success: false});
    } else if((response.email === userMail) || (response.cid.extid === cid && roles.indexOf('administrator') !== -1)) {
      if(type === 'undefined' || type === ""){
        res.status(400);
        logger.log(req, res, {type: 'warn', data: 'Type of update not defined'});
        res.json({error: false, message: 'Type of update not defined...', success: false});
      } else {
        sPutUser.putOne({ uid: o_id,
          updates: updates,
          userMail: userMail,
          userId: userId,
          type: type,
          req: req,
          res: res
        }, function(err, response, success){
          if(err){
            res.status(500);
            logger.log(req, res, {type: 'error', data: response});
            res.json({error: err, message: response, success: success});
          } else if(!success){
            res.status(400);
            logger.log(req, res, {type: 'warn', data: response});
            res.json({error: err, message: response, success: success});
          } else {
            res.status(200);
            logger.log(req, res, {type: 'audit', data: "User updated: " + response.email});
            res.json({error: err, message: "User updated: " + response.email, success: success});
          }
        });
      }
    } else {
      res.status(401);
      logger.log(req, res, {type: 'warn', data: 'Not authorized to update this user'});
      res.json({error: false, message: 'Not authorized to update this user...', success: false});
    }
  });
};

/**
 * Deletes a user
 *
 * @param {String} uid
 *
 * @return {String} Acknowledgement
 */
exports.removeUser = function(req, res, next) {
  var uid = [];
  var my_cid = req.body.decoded_token.orgid;
  var finalResp;
  uid.push(mongoose.Types.ObjectId(req.params.uid));
  if(req.body.decoded_token.roles.indexOf('administrator') === -1){
    res.status(404);
    logger.log(req, res, {type: 'warn', data: "Need admin privileges to remove a user"});
    res.json({'error': false, 'message': "Need admin privileges to remove a user..."});
  } else if(req.params.uid.toString() === req.body.decoded_token.uid.toString()){
    res.status(401);
    logger.log(req, res, {type: 'warn', data: "You cannot remove yourself"});
    res.json({'error': false, 'message': "You cannot remove yourself..."});
  } else {
    delUser.isMyUser(my_cid, req.params.uid) // Check if user belongs to me
    .then(function(response){
      if(response){
        logger.log(req, res, {type: 'audit', data: "User removed"});
        finalRes = "User removed";
        return delUser.deleteAllUsers(uid, req, res);
      } else {
        res.status(401);
        logger.log(req, res, {type: 'warn', data: "User does not belong to you"});
        finalRes = "User does not belong to you";
        return false; // User does not belong to you
      }
    })
    .then(function(response){
      res.json({'error': false, 'message': finalRes});
    })
    .catch(function(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({'error': true, 'message': err});
    });
  }
};
