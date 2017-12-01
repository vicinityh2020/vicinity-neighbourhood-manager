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

// Internal call

function putAuditInt(id, payload){
  return new Promise(
    function(resolve, reject) {
      auditOp.update({auditId: id}, {$push: {data: payload}}, {upsert: true})
      .then(function(response){
        logger.debug('Audit success');
        resolve({"res":response});
      })
      .catch(function(error){
        logger.debug('Audit error: ' + error);
        reject({"res":error});
      });
    }
  );
}

//Export modules

module.exports.putAuditExt = putAuditExt;
module.exports.putAuditInt = putAuditInt;
