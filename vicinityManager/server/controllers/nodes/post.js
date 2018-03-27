
// Global objects

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sNodePost = require('../../services/nodes/post');

// Functions

/*
Creates a node for an organisation
Creates relevant users and groups in commServer
Receives request from client
*/
function postOne(req, res, next) {
  var data = req.body;
  var company_id = mongoose.Types.ObjectId(req.params.id);
  sNodePost.postOne(data, company_id, function(err, response){
    res.json({error: err, message: response});
  });
}

// Export Functions

module.exports.postOne = postOne;
