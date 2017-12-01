
// Global objects and variables

var mongoose = require('mongoose');
var auditOp = require('../../models/vicinityManager').auditLog;
var logger = require("../../middlewares/logger");


function getAudit(req, res){
  var id = req.params.id; //mongoose.Types.ObjectId(req.params.id);
  // // TODO Once too many audit logs in a document, consider filter the resulting array by date before returning to client
  auditOp.findOne({auditId: id}).populate('data.orgOrigin','organisation').populate('data.orgDest','organisation').populate('data.auxConnection.item','name').exec(function(err,data){
    if(err){
      res.json({"error":"true", "message": err});
    } else if(!(data)){
      res.json({"error":"false", "message":"No audits found..."});
    } else {
      res.json({"error":"false", "message": data});
    }
  });
}

module.exports.getAudit = getAudit;
