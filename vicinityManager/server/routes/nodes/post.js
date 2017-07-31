
// Global objects

var mongoose = require('mongoose');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
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
  db.organisation = cid;
  db.adid = uuid();

  db.save(function(err,data){
    if(err){
      logger.debug("Error creating the node");
    }else{
      successSave(data, req, res);
    }
  });
}

function successSave(data, req, res){ // Saves node in MONGO

  var payload = {
    username : data.adid,
    name: data.name,
    password: req.body.pass
    // properties: { property:
    //             [
    //               {'@key':'agent', '@value': data.agent},
    //               {'@key':'uri', '@value': data.eventUri}
    //                   ]}
  };

  var groupData = {
    name: data.adid,
    description: data.name
  };

  commServer.callCommServer(payload, 'users', 'POST') // Saves node in commServer
  .then(
    function(response){
      commServer.callCommServer({}, 'users/' + data.adid + '/groups/' + data.organisation.toString() + '_agents', 'POST')  //Add node to company group in commServer
      .then(
        function(response){
          commServer.callCommServer(groupData, 'groups/', 'POST') // Create node group in commServer
          .then(
            function(response){
              userAccountOp.update( { _id: data.organisation}, {$push: {hasNodes: data.adid}}, function(err,data){ // Add node to company in MONGO
                if(err){
                  logger.debug("Error creating the node " + err);
                }else{
                  response = {"error": false, "message": "Node created!"};
                  res.json(response);
                }
              });
            },
            callbackError
          );
        },
          callbackError
        );
      },
    callbackError)
  .catch(callbackError);
}

  // Private functions

  /*
  Handles errors
  */
  function callbackError(err){
    //TODO delete the node on error
    logger.debug("Error creating the node: " + err);
  }


// Export Functions

module.exports.postOne = postOne;
