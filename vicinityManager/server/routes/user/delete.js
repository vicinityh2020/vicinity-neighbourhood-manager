var mongoose = require('mongoose');

var userOp = require('../../models/vicinityManager').user;


function deleteUser(req, res, next) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  userOp.remove({ "_id" : o_id}, function(err) {
    res.json({"error" : err});
  });
}

module.exports.deleteUser = deleteUser;
