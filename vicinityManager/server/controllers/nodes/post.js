
// Global objects

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sNodePost = require('../../services/nodes/post');

// Functions

/*
Creates a node for an organisation
Creates relevant users and groups in commServer
Receives request from client
*/
function postOne(req, res, next) {
  sNodePost.postOne(req, res, function(err, response, success){
    if(err) logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response, success: success});
  });
}

// Export Functions

module.exports.postOne = postOne;
