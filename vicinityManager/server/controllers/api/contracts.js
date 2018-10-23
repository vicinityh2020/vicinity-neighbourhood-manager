// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sGetItems = require("../../services/items/get");
var ctHelper = require("../../services/contracts/contracts.js");
var ctChecks = require("../../services/contracts/contractChecks.js");

/*
Contracts --------------------------------------------------
*/

/**
 * Contract requests
 * @return {Array} Open Contracts
 */
exports.contractFeeds = function(req, res, next) {
  ctHelper.contractFeeds(req.body.decoded_token.uid, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
};

/**
 * Get contract info
 * @param {String} ctid
 *
 * @return {Object} Contract Info
 */
exports.contractInfo = function(req, res, next) {
  ctHelper.contractInfo(req, res, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    if(!response) res.status(404);
    res.json({error: err, message: response});
  });
};

/**
 * Get my items valid for sharing data with a third party service
 * @param {String} cid
 * @param {String} oid
 *
 * @return {Array} items
 */
exports.contractValidItems = function(req, res, next) {
  var api = true; // Call origin api or webApp
  sGetItems.getMyContractItems(req, res, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    if(!response) res.status(404);
    res.json({error: err, message: response});
  });
};

/**
 * Get the items that are sharing data with a certain service
 * @param {String} oid
 *
 * @return {Array} items
 */
exports.contractContractedItems = function(req, res, next) {
  var api = true; // Call origin api or webApp
  sGetItems.getItemsContracted(req, res, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    if(!response) res.status(404);
    res.json({error: err, message: response});
  });
};

/**
 * Post contract
 *
 * @param {String} readWrite
 * @param {Object} serviceProvider
 * @param {Object} iotOwner
 *
 * Object contains:
 * cidService, uidService, [oidService]
 * cidDevice, uidDevice, [oidDevices]
 * readWrite (Boolean)
 *
 * @return {String} Acknowledgement
 */
exports.requestContract = function(req, res, next) {
  var data = req.body;
  var cid = req.body.decoded_token.orgid;
  var roles = req.body.decoded_token.roles;
  ctChecks.postCheck(data, roles, cid, function(error, response, success){
    if(error){
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: error, message: response});
    } else if(!success){
      res.status(400);
      logger.log(req, res, {type: 'warn', data: response});
      res.json({error: error, message: response});
    } else {
      ctHelper.creating(req, res, function(err, response){
        if(err) logger.log(req, res, {type: 'error', data: response});
        res.json({error: err, message: response});
      });
    }
  });
};

/**
 * Manage contract -- Update or remove
 *
 * @param {String} type - update/delete/accept
 * @param {String} ctid
 *
 * @return {String} Acknowledgement
 */
exports.manageContract = function(req, res, next) {
  var id, data;
  var uid = req.body.decoded_token.uid;
  var cid = req.body.decoded_token.orgid;
  if(req.body.type === 'delete'){
    id = req.params.id;
    ctChecks.deleteCheck(id, uid, cid, function(error, response, success){
      if(error){
        logger.log(req, res, {type: 'error', data: response});
        res.json({error: error, message: response});
      } else if(!success){
        res.status(400);
        logger.log(req, res, {type: 'warn', data: response});
        res.json({error: error, message: response});
      } else {
        ctHelper.removing(req, res, function(err, response){
          if(err) logger.log(req, res, {type: 'error', data: response});
          res.json({error: err, message: "Contract successfully removed"});
        });
      }
    });
  } else if(req.body.type === 'accept') {
    id = req.params.id;
    ctChecks.acceptCheck(id, uid, cid, function(error, response, success){
      if(error){
        logger.log(req, res, {type: 'error', data: response});
        res.json({error: error, message: response});
      } else if(!success){
        res.status(400);
        logger.log(req, res, {type: 'warn', data: response});
        res.json({error: error, message: response});
      } else {
          ctHelper.accepting(req, res, function(err, response){
          if(err) logger.log(req, res, {type: 'error', data: response});
          res.json({error: err, message: response});
        });
      }
    });
  } else {
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Wrong type. Please choose among accept or delete"});
    res.json({error: false, message: "Wrong type. Please choose among accept or delete"});
  }
};
