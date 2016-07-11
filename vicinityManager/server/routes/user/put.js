var mongoose = require('mongoose');

var userOp = require('../../models/vicinityManager').user;


function putOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  userOp.update({ "_id": o_id}, {$set: updates}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
  })
}

module.exports.putOne = putOne;
