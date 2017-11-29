var mongoose = require('mongoose');

var userOp = require('../../models/vicinityManager').user;


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
  .then(function(response){ res.json({"error": err, "message": raw}); })
  .catch(function(err){res.json({"error": err, "message": raw}); });
}

module.exports.putOne = putOne;
