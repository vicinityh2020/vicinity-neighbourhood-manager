
// Global objects and variables

var mongoose = require('mongoose');
var auditOp = require('../../models/vicinityManager').auditLog;
var logger = require("../../middlewares/logger");


function getAudit(req, res){
  // var id = mongoose.Types.ObjectId(req.params.id);
  // // TODO Once too many audit logs in a document, consider filter the resulting array by date before returning to client
  // auditOp.findById(id).populate('user','email name').populate('orgOrigin','organisation').populate('orgDest','organisation').exec(function(err,data){
  //
  // });
}

module.exports.getAudit = getAudit;
