var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

function putOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
    nodeOp.findByIdAndUpdate(o_id, {$set: updates}, { new: true }, function(err, data){
      if(!err){
          var response = {"error": err, "message": data};
          res.json(response);
      }
    })
}

function deleteOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;

    userAccountOp.update({_id: o_id}, {$set: updates}, function(err, data){
      if(!err){
          var response = {"error": err};
          res.json(response);
      }
  })
}


module.exports.putOne = putOne;
module.exports.deleteOne = deleteOne;
