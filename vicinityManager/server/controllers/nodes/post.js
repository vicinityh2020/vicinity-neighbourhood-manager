
// Global objects

var mongoose = require('mongoose');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../services/commServer/request');
var audits = require('../../controllers/audit/put');

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
