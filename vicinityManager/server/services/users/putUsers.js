var mongoose = require('mongoose');
var audits = require('../../controllers/audit/put');
var userOp = require('../../models/vicinityManager').user;
var logger = require("../../middlewares/logger");
var authHelper = require('../../services/login/login');
var bcrypt = require('bcrypt');

function putOne(o_id, updates, userMail, callback) {
  var updItem;
  userOp.findOneAndUpdate( { "_id": o_id}, {$set: updates}, {new: true})
  .then(function(response){
    updItem = response;
    return audits.putAuditInt(
      updItem.organisation,
      { orgOrigin: updItem.organisation,
        auxConnection: {kind: 'user', item: o_id},
        user: userMail,
        eventType: 13 }
    );
  })
  .then(function(response){
    logger.audit({user: userMail, action: 'updateUser', item: o_id });
    callback(false, updItem); })
  .catch(function(err){
    logger.error({user: userMail, action: 'updateUser', item: o_id, message: err });
    callback(true, err);
  });
}

function putPassword(id, oldPwd, newPwd, callback){
  var hash = "";

  userOp.findOne({_id:id},{authentication:1})
  .then(function(response){
    hash = response.authentication.hash;
    logger.debug(hash);
    return bcrypt.compare(oldPwd, hash); // True if valid pwd
  })
  .then(function(response){
    logger.debug(response);
    if(response){
      authHelper.updatePwd(id, newPwd, function(err, response){
        callback(false, response, true);
      });
    } else {
      callback(false, "Wrong password", false);
    }
  })
  .catch(function(err){
    callback(true, err, false);
  });
}

module.exports.putOne = putOne;
module.exports.putPassword = putPassword;
