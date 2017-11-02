
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
    var adid = req.params.id;
    var updates = req.body;

    nodeOp.findOneAndUpdate({adid: adid}, {$set: updates}, { new: true }, function(err, data){
      if(err){
          logger.debug("Error updating the node");
      }else{
        if(req.body.status === 'deleted'){
          var adids = [];
          adids.push(adid);
          myNode.deleteNode(adids)
          .then(function(response){res.json({'error': false, 'message': response});})
          .catch(function(err){res.json({'error': true, 'message': err});});
        }else{
          data.pass = req.body.pass;
          myNode.updateNode(data)
          .then(function(response){res.json({'error': false, 'message': response});})
          .catch(function(err){res.json({'error': true, 'message': err});});
        }
      }
    });
  }

// Function 2

/*
Update organisation nodes list
Deletes node reference in useraccounts
Breaks connection with organisation in MONGO
*/
function pullIdFromOrganisation(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var adid = req.body.adid;

  userAccountOp.update({_id: o_id}, { $pull: {hasNodes: adid} },
    function(err, data){
      if(!err){
        res.json({"error":false, 'message': 'Node ID removed from organisation list.' });
      } else {
        res.json({"error": true, 'message': 'Something went wrong ' + err });
      }
    }
  );
}

// Export Functions

module.exports.putOne = putOne;
module.exports.pullIdFromOrganisation = pullIdFromOrganisation;
