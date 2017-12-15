var mongoose = require('mongoose');
var audits = require('../../routes/audit/put');
var userOp = require('../../models/vicinityManager').user;
var logger = require("../../middlewares/logger");

function putOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  delete updates.userMail;
  userOp.findOne({ "_id": o_id})
  .then(function(response){
    audits.putAuditInt(
      response.organisation,
      { orgOrigin: response.organisation,
        auxConnection: {kind: 'user', item: o_id},
        user: req.body.userMail,
        eventType: 13 }
    );
  })
  .then(function(response){ return userOp.update({ "_id": o_id}, {$set: updates}); })
  .then(function(response){
    logger.audit({user: req.body.userMail, action: 'updateUser', item: o_id });
    res.json({"error": false, "message": response}); })
  .catch(function(err){
    logger.error({user: req.body.userMail, action: 'updateUser', item: o_id, message: err });
    res.json({"error": err, "message": "Something went wrong..."});
  });
}

module.exports.putOne = putOne;
