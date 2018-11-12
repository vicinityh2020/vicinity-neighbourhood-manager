// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var userAccountOp = require("../../models/vicinityManager").userAccount;
var sRegister = require("../../services/registrations/register.js");
var sGetUser = require("../../services/users/getUsers");
var sGetItems = require("../../services/items/get");
var sGetAgents = require("../../services/nodes/get");
var sGetOrganisation = require("../../services/organisations/get");
var sOrgConfiguration = require('../../services/organisations/configuration');

// Main functions - VCNT API

/*
Organisations --------------------------------------------------
*/

/**
 * Get my organisation
 *
 * @param null
 *
 * @return {Object} My organisation
 */
exports.getMyOrganisation = function(req, res, next){
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  userAccountOp.findOne({_id: cid}, {name:1, cid:1, accountOf:1, knows:1, hasNodes:1}, function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: 'Server error'});
    } else if(!response){
      res.status(404).json({error: false, message: "Organisation not found"});
    } else {
      res.json({error: false, message: response});
    }
  });
};

/**
 * Get all organisations
 *
 * @param null
 *
 * @return {Object} Array of organisations
 */
exports.getOrganisations = function(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = 0; // 0 all, 1 friends, else not friends
  var api = true;
  var offset = typeof req.query.offset === 'undefined' ? 0 : req.query.offset;
  var limit = typeof req.query.limit === 'undefined' ? 25 : req.query.limit;
  if (typeof offset != "number" || typeof limit != "number") {
    res.status(400).json({error: false, message: "Query parameters must be number"});
  }
  limit = limit > 25 ? 25 : limit; // Max limit
  sGetOrganisation.getAll(cid, type, offset, limit, api, function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: 'Server error'});
    } else if(response.length === 0){
      res.status(404).json({error: false, message: "Organisations not found"});
    } else {
      res.json({error: false, message: response});
    }
  });
};

/**
 * Get organisation friends
 *
 * @param null
 *
 * @return {Object} Array of organisations
 */
exports.getFriends = function(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = 1; // 0 all, 1 friends, else not friends
  var api = true;
  var offset = typeof req.query.offset === 'undefined' ? 0 : req.query.offset;
  var limit = typeof req.query.limit === 'undefined' ? 25 : req.query.limit;
  if (typeof offset !== "number" || typeof limit !== "number") {
    res.status(400).json({error: false, message: "Query parameters must be number"});
  }
  limit = limit > 25 ? 25 : limit; // Max limit
  sGetOrganisation.getAll(cid, type, offset, limit, api, function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: 'Server error'});
    } else if(response.length === 0){
      res.status(404).json({error: false, message: "Organisations not found"});
    } else {
      res.json({error: false, message: response});
    }
  });
};

/**
 * Get organisation users
 *
 * @param {String} cid
 *
 * @return {Object} Array of users
 */
exports.getUsers = function(req, res, next) {
  var api = true;
  if(req.params.cid == null){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing organisation ID"});
    res.json({error: false, message: "Missing organisation ID"});
  } else {
    sGetUser.getAll(req, res, api, function(err,response){
      if(err){
        res.status(500);
        logger.log(req, res, {type: 'error', data: err});
        res.json({error: true, message: 'Server error'});
      } else if(!response){
        res.status(404).json({error: false, message: "Users not found"});
      } else {
        res.json({error: false, message: response});
      }
    });
  }
};

/**
 * Get organisation items
 *
 * @param {String} cid
 * @param {String} type (query)
 * @param {String} offset (query)
 * @param {String} limit (query)
 *
 * @return {Object} Array of items
 */
exports.getItems = function(req, res, next) {
  var api = true; // Call origin api or webApp
  if(req.params.cid == null){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing organisation ID"});
    res.json({error: true, message: "Missing organisation ID"});
  } else {
    sGetItems.getOrgItems(req, res, api, function(err, response){
      if(err){
        res.status(500);
        logger.log(req, res, {type: 'error', data: err});
        res.json({error: true, message: 'Server error'});
      } else if(response.length === 0){
        res.status(404).json({error: false, message: "Items not found"});
      } else {
        res.json({error: false, message: response});
      }
    });
  }
};

/**
 * Get organisation agents
 *
 * @param null
 *
 * @return {Object} Array of agents
 */
exports.getAgents = function(req, res, next) {
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var api = true; // Call origin api or webApp
  sGetAgents.getOrgAgents(mycid, api, function(err, response){
    if(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: 'Server error'});
    } else if(!response){
      res.status(404).json({error: false, message: "Organisation not found"});
    } else {
      res.json({error: false, message: response});
    }
  });
};

/**
 * Creates a registration request that needs to be approved
 *
 * @param {Object} data
 * password, userName, email, occupation, companyName, companyLocation,
 * businessId, termsAndConditions
 * @return {String} Acknowledgement
 */
exports.createOrganisation = function(req, res, next) {
  var data = req.body;
  var finalRes;
  data.type = "newCompany";
  sRegister.findDuplicatesUser(data)
  .then(function(dup){
    if(!dup){
      return sRegister.findDuplicatesCompany(data);
    }else{
      finalRes = {error: false, message: "Mail already registered"};
      return true; // Duplicates found at mail stage
    }
  }).then(function(dup){
    if(!dup){
      sRegister.validateBody(data, false, function(err, response){
        if(err){
          res.status(500);
          res.json({error: err, message: response});
        } else {
          sRegister.requestReg(req, res, function(err, response){
            if(err){
              res.status(500);
              logger.log(req, res, {type: 'error', data: response});
            } else {
              res.status(200);
              logger.log(req, res, {type: 'audit', data: response});
            }
            res.json({error: err, message: response});
          });
        }
      });
    }else{
      if(typeof finalRes !== "object"){ finalRes = {error: false, message: "Company name or business ID already exist"}; } // Dups found at org stage
      res.status(400);
      logger.log(req, res, {type: 'warn', data: finalRes.message});
      res.json(finalRes);
    }
  }).catch(function(err){
    res.status(500);
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err});
  });
};

/**
 * Creates a registration request that does NOT need to be approved
 *
 * @param {Object} data
 *
 * data.user: userName, occupation, contactMail, password
 * data.organisations: businessId, companyName, companyLocation
 *
 * @return {String} Acknowledgement
 */
exports.createOrganisationAuto = function(req, res, next){
  var mail = req.body.decoded_token.sub;
  if(req.body.decoded_token.roles.indexOf('superUser') !== -1){
    sRegister.findDuplicatesCompany({companyName: req.body.organisation.companyName})
    .then(function(dup){
      if(!dup){
        sRegister.validateBody(req.body, true, function(err, response){
          if(!err){
            sRegister.fastRegistration(req, res, function(err, response){
              if(err) {
                res.status(500);
                logger.log(req, res, {type: 'error', data: response});
              }
                res.json({error: err, message: response});
            });
          } else {
            res.status(400);
            logger.log(req, res, {type: 'error', data: response});
            res.json({error: err, message: response});
          }
        });
      } else {
        res.status(400);
        logger.log(req, res, {type: 'warn', data: 'Organisation name duplicated'});
        res.json({error: true, message: 'Organisation name duplicated'});
      }
    })
    .catch(function(err){
      res.status(500);
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: 'Server error'});
    });
  } else {
    res.status(403);
    logger.log(req, res, {type: 'warn', data: "Unauthorized"});
    res.json({error: true, message: 'Need special role'});
  }
};

/**
 * Removes an organisation
 *
 * @param {Object} null
 *
 * @return {String} Acknowledgement
 */
exports.removeOrganisation = function(req, res, next) {
  if(req.body.decoded_token.roles.indexOf('administrator') === -1){
    res.status(403);
    logger.log(req, res, {type: 'warn', data: "Need admin privileges to remove an organisation"});
    res.json({'error': false, 'message': "Need admin privileges to remove an organisation..."});
  } else {
    sOrgConfiguration.remove(req, res, function(err, response){
      if(err){
        res.status(500);
        logger.log(req, res, {type: 'error', data: response});
      } else {
        logger.log(req, res, {type: 'audit', data: response});
      }
      res.json({"error": err, "message": response});
    });
  }
};
