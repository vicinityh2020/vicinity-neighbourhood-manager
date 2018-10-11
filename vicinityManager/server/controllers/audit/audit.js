
// Global objects and variables
var mongoose = require('mongoose');
var logger = require('../../middlewares/logBuilder');
var auditHelper = require('../../services/audit/audit');
var moment = require('moment');

function getAudit(req, res){
  var c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var id = mongoose.Types.ObjectId(req.params.id);
  var type = req.query.hasOwnProperty('type') && req.query.type !== 'undefined' ? req.query.type : false; // user, userAccount, item
  var searchDate = req.query.hasOwnProperty('searchDate') && req.query.searchDate !== 'undefined' ?
                  auditHelper.objectIdWithTimestamp(req.query.searchDate):
                  auditHelper.objectIdWithTimestamp(moment().subtract(7, 'days').valueOf());

  if(type === false){
    logger.log(req, res, {message: "Model type missing, not possible to retrieve audits...", type: debug});
    res.json({error: false , message: 'Model type needed!', success: false});
  } else {
    auditHelper.get(id, c_id, type, searchDate, function(err, response, success){
      if(err) logger.log(req, res, {type: 'error', data: response});
      if(response.type === "debug") logger.log(req, res, response);
      res.json({error: err, message: response.data, success: success});
    });
  }
}

// External call

function postAudit(req, res){
  var payload = req.body.payload;
  auditHelper.create(payload.actor, payload.target, payload.object, payload.type, payload.description)
  .then(function(response){
    res.json({error: false, message: 'Audit created', success: response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err.data, success: false});
  });
}


//Export modules

module.exports.postAudit = postAudit;
module.exports.getAudit = getAudit;
