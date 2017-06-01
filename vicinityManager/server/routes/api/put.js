var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var moment = require('moment');
var logger = require("../../middlewares/logger");

function updatePwd(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  userOp.update({ "_id": o_id}, {$set: updates}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
  })
}

module.exports.updatePwd = updatePwd;
