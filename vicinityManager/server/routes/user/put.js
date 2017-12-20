var mongoose = require('mongoose');
var audits = require('../../routes/audit/put');
var userOp = require('../../models/vicinityManager').user;
var logger = require("../../middlewares/logger");

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

module.exports.putOne = putOne;
