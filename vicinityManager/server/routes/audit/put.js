// Global objects and variables

var mongoose = require('mongoose');
var auditOp = require('../../models/vicinityManager').auditLog;
var logger = require("../../middlewares/logger");

// External call

function putAuditExt(req, res){
  var id = req.params.id; // mongoose.Types.ObjectId(req.params.id);
  var payload = req.body.payload;
  auditOp.update({auditId: id}, {$push: {data: payload}}, {upsert: true})
  .then(function(response){res.json({"res":response});})
  .catch(function(error){res.json({"res":error});});
}

// Internal cancelled

function putAuditInt(id, payload){
  auditOp.update({auditId: id}, {$push: {data: payload}}, {upsert: true})
  .then(function(response){res.json({"res":response});})
  .catch(function(error){res.json({"res":error});});
}

//Export modules
module.exports.putAuditExt = putAuditExt;
module.exports.putAuditInt = putAuditInt;
