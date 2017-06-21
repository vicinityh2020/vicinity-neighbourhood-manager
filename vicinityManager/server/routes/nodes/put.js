var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');

// UPDATE =================================

function putOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;

  nodeOp.findByIdAndUpdate(o_id, {$set: updates}, { new: true }, function(err, data){
    if(err){
        logger.debug("Error updating the node");
    }else{
      if(req.body.status === 'deleted'){
        successDelete(data)
      }else{
        successUpdate(data);
      }
    }
  })

  function successUpdate(data){ // UPDATED node in MONGO then...
    var payload = {
      name: data.name,
      password: req.body.pass,
      properties: { property:
                  [
                    {'@key':'agent', '@value': data.agent},
                    {'@key':'uri', '@value': data.eventUri}
                        ]}
    };
    commServer.callCommServer(payload, 'users/' + data._id, 'PUT', req.headers.authorization) // Update node in commServer
    .then(callBackCommServer(data),callbackError)
  }

  function successDelete(data){ // Change node status to deleted in MONGO then...
    commServer.callCommServer({}, 'users/' + data._id, 'DELETE', req.headers.authorization) // Update node in commServer
    .then(callBackCommServerDelete(data),callbackError)
    .then(callBackCommServer(data),callbackError)
  }

  function callBackCommServerDelete(data){
    return commServer.callCommServer({}, 'groups/' + data._id, 'DELETE', req.headers.authorization)
  }

  function callBackCommServer(data){
    var response = {"error": false, "message": data};
    res.json(response);
  }

  function callbackError(err){
    //TODO delete the node on error
    logger.debug("Error updating the node: " + err);
  }

}

// DELETE =================================

function deleteOne(req, res) { // Delete node ref in useraccounts in MONGO
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
