// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var nodeOp = require("../../models/vicinityManager").node;

var sGetNodeItems = require("../../services/nodes/get.js");
var sCreateNode = require("../../services/nodes/post.js");
var sRemoveNode = require("../../services/nodes/processNode.js");

/*
Agents --------------------------------------------------
*/

/**
 * Get agent items
 *
 * @param {Object} data
 * adid
 * @return {Object} TDs -- Array of Objects, adid -- String
 */
exports.getAgentItems = function(req, res, next) {
  var adid = req.params.id;
  nodeOp.findOne({adid:adid}, {cid:1}, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: true, message: response});
    } else {
      if(response.cid.extid === req.body.decoded_token.cid){
        sGetNodeItems.getNodeItems(adid, function(err, response){
          res.json({error: err, message: response});
        });
      } else {
        logger.log(req, res, {type: 'warn', data: "You are not the owner of the adapter/agent"});
        res.json({error: false, message: "You are not the owner of the adapter/agent"});
      }
    }
  });
};

/**
 * Create agent
 *
 * @param {Object} data
 * name
 * pass
 * eventUri -- Not necessary
 * agent -- Not necessary
 * type
 *
 * @return {Object} AGID and status
 */
exports.createAgent = function(req, res, next) {
  sCreateNode.postOne(req, res, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
  });
};

/**
 * Get agent items
 *
 * @param {String} agid
 *
 * @return {Object} AGID and status
 */
exports.removeAgent = function(req, res, next) {
  var agid = [];
  agid.push(req.params.id);
  var company_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var cid = req.body.decoded_token.cid;
  var userMail = req.body.decoded_token.sub !== 'undefined' ? req.body.decoded_token.sub : "unknown";
  var userId = req.body.decoded_token.uid !== 'undefined' ? req.body.decoded_token.uid : "unknown";
  nodeOp.findOne({adid:agid[0]}, {cid:1}, function(err, response){
    if(err){
      res.json({error: true, message: err});
    } else {
      if(response.cid.extid === req.body.decoded_token.cid){
        sRemoveNode.deleteNode(agid, userMail, userId)
        .then(function(response){
          logger.log(req, res, {data: response, type: "audit"});
          res.json({'error': false, 'message': response});})
        .catch(function(err){
          logger.log(req, res, {data: err, type: "debug"});
          res.json({'error': true, 'message': err});});
      } else {
        res.json({error: true, message: "You are not the owner of the adapter/agent"});
      }
    }
  });
};
