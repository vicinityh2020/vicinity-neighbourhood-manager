/*
This module contains management utilities for the userAccount (Organisation level)
get: get properties (main theme color)
set: set properties (main theme color)
remove: remove organisation
*/

// Global objects
var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sOrgConfiguration = require('../../services/organisations/configuration');

// Public functions

function get(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.params.id);
  sOrgConfiguration.get(cid, function(err, data){
    res.json({"error": err, "message": data});
  });
}

function put(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.params.id);
  var update = req.body;
  sOrgConfiguration.put(cid, update, function(err, data){
    res.json({"error": err, "message": data});
  });
}

/*
Removes organisation and everything under:
Users, nodes, items
*/
function remove(req, res, next) {
  var cid = req.body.decoded_token.cid;
  logger.log(req, res, {type: 'debug', data: "Removing organisation... " + cid});
  sOrgConfiguration.remove(req, res, function(err, data){
    if(err){
      logger.log(req, res, {type: 'error', data: data});
    } else {
      logger.log(req, res, {type: 'audit', data: data});
    }
    res.json({"error": err, "message": data});
  });
}

// Export Functions
module.exports.get = get;
module.exports.put = put;
module.exports.remove = remove;
