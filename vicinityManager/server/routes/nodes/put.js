
// Global objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var myNode = require('../../helpers/nodes/processNode');

// Function 1

  /*
  Updates a node for an organisation
  Adds or deletes a node depending on the status field of the node MONGO object
  Receives request from client
  */
  function putOne(req, res) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;

    nodeOp.findByIdAndUpdate(o_id, {$set: updates}, { new: true }, function(err, data){
      if(err){
          logger.debug("Error updating the node");
      }else{
        if(req.body.status === 'deleted'){
          myNode.deleteNode(o_id, data.hasItems, res);
        }else{
          data.pass = req.body.pass;
          myNode.updateNode(data, res);
        }
      }
    });
  }

// Function 2 - DELETE

/*
Deletes node reference in useraccounts
Breaks connection with organisation in MONGO
*/
function deleteOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;

    userAccountOp.update({_id: o_id}, {$set: updates}, function(err, data){
      if(!err){
          var response = {"error": err};
          res.json(response);
      }
  });
}

// Export Functions

module.exports.putOne = putOne;
module.exports.deleteOne = deleteOne;
