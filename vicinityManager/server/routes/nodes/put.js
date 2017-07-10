
// Global objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');

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
          successDelete(data);
        }else{
          successUpdate(data);
        }
      }
    });

  /*
  On node saved successfully in MONGO,
  the update process continues in the commServer
  */
  function successUpdate(data){
    var payload = {
      name: data.name,
      password: req.body.pass,
      properties: { property:
                  [
                    {'@key':'agent', '@value': data.agent},
                    {'@key':'uri', '@value': data.eventUri}
                        ]}
    };
    commServer.callCommServer(payload, 'users/' + data._id, 'PUT') // Update node in commServer
    .then(callBackCommServer(data),callbackError);
  }

  /*
  On node status active in MONGO,
  the update process continues in the commServer
  */
  function successDelete(data){ // Change node status to deleted in MONGO then...
    commServer.callCommServer({}, 'users/' + data._id, 'DELETE') // Update node in commServer
    .then(callBackCommServerDelete(data),callbackError)
    .then(callBackCommServer(data),callbackError);
  }

// Callbacks

  /*
  On node status changed to deleted in MONGO,
  the update process continues in the commServer
  */
  function callBackCommServerDelete(data){
    return commServer.callCommServer({}, 'groups/' + data._id, 'DELETE');
  }

  /*
  Sends response when process completed
  */
  function callBackCommServer(data){
    var response = {"error": false, "message": data};
    res.json(response);
  }

  function callbackError(err){
    //TODO delete the node on error
    logger.debug("Error updating the node: " + err);
  }

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
