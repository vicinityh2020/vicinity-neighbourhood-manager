
// Global objects and variables
var mongoose = require('mongoose');
var logger = require('../../middlewares/logger');
var auditHelper = require('../../services/audit/audit');

function getAudit(req, res){
  var c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var id = mongoose.Types.ObjectId(req.params.id);
  var type = req.query.type; // user, userAccount, item
  var searchDate = req.query.searchDate;
  auditHelper.get(id, c_id, type, searchDate, function(err, response, success){
    res.json({error: err, response: response, success: success});
  });
}

// External call

function postAudit(req, res){
  var payload = req.body.payload;
  auditHelper.create(payload.actor, payload.target, payload.object, payload.type, payload.description)
  .then(function(response){
    res.json({error: false, message: 'Audit created', success: response});
  })
  .catch(function(err){
    res.json({error: true, message: err, success: false});
  });
}


//Export modules

module.exports.postAudit = postAudit;
module.exports.getAudit = getAudit;
