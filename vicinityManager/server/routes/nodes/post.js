
// Global objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');

// Functions

/*
Creates a node for an organisation
Creates relevant users and groups in commServer
Receives request from client
*/
function postOne(req, res, next) {
  var db = new nodeOp();
  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  db.name = req.body.name;
  db.eventUri = req.body.eventUri;
  db.agent = req.body.agent;
  db.type = req.body.type;
  db.status = "active";

  db.save(function(err,data){
    if(err){
      logger.debug("Error creating the node");
    }else{
      successSave(data);
    }
  });

  function successSave(data){ // Saves node in MONGO
    var payload = {
      username : data._id,
      name: data.name,
      password: req.body.pass,
      properties: { property:
                  [
                    {'@key':'agent', '@value': data.agent},
                    {'@key':'uri', '@value': data.eventUri}
                        ]}
    };
    commServer.callCommServer(payload, 'users', 'POST') // Saves node in commServer
    .then(callBackCommServer1(data),callbackError)
    .then(callBackCommServer2(data),callbackError)
    .then(callBackCommServer3(data),callbackError);
  }

  // Callbacks

/*
Add node to company group in commServer
*/
  function callBackCommServer1(data){
    return commServer.callCommServer({}, 'users/' + data._id + '/groups/' + cid + '_agents', 'POST');
  }

/*
Create node group in commServer
*/
  function callBackCommServer2(data){
    var groupData = {
      name: data._id,
      description: data.name
    };
    return commServer.callCommServer(groupData, 'groups/', 'POST');
  }

/*
Add node to company in MONGO
*/
  function callBackCommServer3(data){
    userAccountOp.update({ "_id": cid}, {$push: {hasNodes:data._id}}, function(err,data){
      if(err){
        logger.debug("Error creating the node");
      }else{
        response = {"error": false};
        res.json(response);
      }
    });
  }

  /*
  Handles errors
  */
  function callbackError(err){
    //TODO delete the node on error
    logger.debug("Error creating the node: " + err);
  }

}

// Export Functions

module.exports.postOne = postOne;
