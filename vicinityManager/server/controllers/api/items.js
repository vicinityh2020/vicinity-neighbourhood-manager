// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sItemUpdate = require('../../services/items/update');
var semanticRepo = require("../../services/semanticRepo/request.js");

/*
Items --------------------------------------------------
*/

exports.getItem = function(req, res, next) {
    res.json({error: false, message: "Use agent..."});
};

exports.createItem = function(req, res, next) {
    res.json({error: false, message: "Use agent..."});
};

exports.removeItem = function(req, res, next) {
    res.json({error: false, message: "Use agent..."});
};

// Validate TD service - Just relay body to semantic repo
exports.validateItemDescription = function(req, res, next){
  semanticRepo.callSemanticRepo(req.body, "td/validate", "POST")
  .then(function(response){
    res.setHeader('Content-Type', 'application/json');
    res.json(JSON.parse(response));
  })
  .catch(function(error){
    res.status(500);
    logger.log(req, res, {type: 'error', data: error});
    res.json({error: true, message: error});
  });
};

/**
* Get annotations from semanticRepo
* @param {Boolean} hierarchical Optional as a query value
*/
exports.getAnnotations = function(req, res, next){
  var hier = req.query.hierarchical !== 'undefined' ? req.query.hierarchical : false;
  var endpoint;
  if(hier === 'true'){ endpoint = "annotations/hierarchy"; } else { endpoint = "annotations"; }
  semanticRepo.callSemanticRepo({}, endpoint, "GET")
  .then(function(response){
    res.setHeader('Content-Type', 'application/json');
    res.json(JSON.parse(response));
  })
  .catch(function(error){
    res.status(500);
    logger.log(req, res, {type: 'error', data: error});
    res.json({error: true, message: error});
  });
};

/**
 * Update an item
 *
 * @param {Array} uids + thing to update
 *
 * @return {String} Acknowledgement
 */
exports.updateItem = function(req, res, next) {
    if(!req.body.multi && Object.keys(req.body).length < 5){
      res.status(400);
      res.json({error: false, message: "Missing fields", success: false});
    } else {
      if(req.body.multi){
       sItemUpdate.updateManyItems(req, res, function(err, success, response){
        if(err) res.status(500);
        if(!err) res.status(200);
        res.json({error: err, message: response, success: success});
       });
      }else if(req.body.status === 'enabled'){
        sItemUpdate.enableItem(req, res, function(value, err, success, response){
          if(err) res.status(500);
          if(!success) res.status(401);
          res.json({error: err, message: response, success: success, id: value});
        });
      }else if(req.body.status === 'disabled'){
        sItemUpdate.disableItem(req, res, function(value, err, success, response){
          if(err) res.status(500);
          if(!success) res.status(401);
          res.json({error: err, message: response, success: success, id: value});
        });
      }else{
        sItemUpdate.updateItem(req, res, function(value, err, success, response){
          if(err) res.status(500);
          if(!success) res.status(401);
          res.json({error: err, message: response, success: success, id: value});
        });
      }
    }
  };
