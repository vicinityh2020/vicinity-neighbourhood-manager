
// Global objects and variables
var mongoose = require('mongoose');
var logger = require('../../middlewares/logBuilder');
var auditHelper = require('../../services/audit/audit');
var moment = require('moment');

function getAudit(req, res){
  var type = req.query.hasOwnProperty('type') && req.query.type !== 'undefined' ? req.query.type : false; // user, userAccount, item

  if(type === false){
    logger.log(req, res, {message: "Model type missing, not possible to retrieve audits...", type: 'warn'});
    res.json({error: false , message: 'Model type needed!', success: false});
  } else {
    auditHelper.get(req, res, function(err, response, success){
      if(err) logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response, success: success});
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
    res.json({error: true, message: err, success: false});
  });
}


//Export modules

module.exports.postAudit = postAudit;
module.exports.getAudit = getAudit;
