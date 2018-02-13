var mongoose = require('mongoose');
var audits = require('../../controllers/audit/put');
var userOp = require('../../models/vicinityManager').user;
var logger = require("../../middlewares/logger");
var authHelper = require('../../services/login/login');
var bcrypt = require('bcrypt');

function putOne(req, res) {
  var response = {};
  var updItem;
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var userMail = updates.userMail;
  delete updates.userMail;
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
    res.json({"error": false, "message": updItem}); })
  .catch(function(err){
    logger.error({user: userMail, action: 'updateUser', item: o_id, message: err });
    res.json({"error": err, "message": "Something went wrong..."});
  });
}

function putPassword(req, res){
  var oldPwd = req.body.passwordOld;
  var newPwd = req.body.passwordNew;
  var id = req.params.id;
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
        res.json({error: err, message: response, success: true});
      });
    } else {
      res.json({error: false, message: "Wrong password", success: false});
    }
  })
  .catch(function(err){
    res.json({error: true, success: false, message: err});
  });
}

module.exports.putOne = putOne;
module.exports.putPassword = putPassword;
