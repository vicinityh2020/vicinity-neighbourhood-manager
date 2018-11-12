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
  var idQuery = checkId(req.params.id);
  var adid;
  nodeOp.findOne(idQuery, {cid:1, adid: 1}, function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: true, message: response});
    } else if(!response) {
      res.status(404);
      logger.log(req, res, {type: 'warn', data: 'Agent not found'});
      res.json({error: false, message: response});
    } else {
      adid = response.adid;
      if(response.cid.extid === req.body.decoded_token.cid){
        sGetNodeItems.getNodeItems(adid, function(err, response){
          if(response.length === 0) res.status(404);
          res.json({error: err, message: response});
        });
      } else {
        res.status(401);
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
  sCreateNode.postOne(req, res, function(err, response, success){
    if(err) {
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
    }
    if(success) res.status(200);
    res.json({error: err, message: response, success: success});
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
  var idQuery = {};
  idQuery = checkId(req.params.id);
  idQuery.status = { $ne: "deleted" };
  var agid = [];
  var company_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var cid = req.body.decoded_token.cid;
  if(req.body.decoded_token){
    req.body.decoded_token.sub = req.body.decoded_token.sub || null;
    req.body.decoded_token.uid = req.body.decoded_token.uid || null;
  } else {
    req.body = {};
    req.body.decoded_token = {sub : null, uid: null};
  }
  nodeOp.findOne(idQuery, {cid:1, adid: 1}, function(err, response){
    if(err){
      res.status(500);
      res.json({error: true, message: err});
    } else if(!response) {
      res.status(404);
      res.json({error: false, message: "Agent not found"});
    } else {
      if(response.cid.extid === req.body.decoded_token.cid){
        agid.push(response.adid);
        sRemoveNode.deleteNode(agid, req, res)
        .then(function(response){
          res.json({'error': false, 'message': response});})
        .catch(function(err){
          res.status(500);
          res.json({'error': true, 'message': err});});
      } else {
        res.status(401);
        res.json({error: true, message: "You are not the owner of the adapter/agent"});
      }
    }
  });
};

function checkId(id){
  try{
    var new_id = mongoose.Types.ObjectId(id);
    return {"_id": new_id };
  } catch(err) {
    return { "adid": id };
  }
}
