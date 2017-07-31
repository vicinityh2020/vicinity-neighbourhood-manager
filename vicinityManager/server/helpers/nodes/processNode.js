// Global Objects

var mongoose = require('mongoose');
var logger = require('../../middlewares/logger');
var commServer = require('../../helpers/commServer/request');
var myItems = require('../../helpers/items/deleteItems');
var nodeOp = require('../../models/vicinityManager').node;

// Public functions

/*
Change node status to deleted in MONGO
Remove node from commServer
Remove all oids under node from commServer AND MONGO
*/
function deleteNode(adid, items, res){

    commServer.callCommServer({}, 'users/' + adid, 'DELETE') // Update node in commServer
    .then(
      function(response){
        commServer.callCommServer({}, 'groups/' + adid, 'DELETE')
        .then(
          function(response){
            // logger.debug(items);
            var query = {
              'status': 'deleted',
              'name': 'empty'
            };
            nodeOp.update({adid: adid}, { $set: query });
            myItems.deleteItems(items, res);
          },
          errorCallback
        );
      },
      errorCallback
    );
}

/*
On node saved successfully in MONGO,
the update process continues in the commServer
*/
  function updateNode(data, res){
    var payload = {
      name: data.name,
      password: data.pass,
    };
    commServer.callCommServer(payload, 'users/' + data.adid, 'PUT') // Update node in commServer
    .then(
      function(response){
        var payload2 = {
          name: data.adid,
          description: data.name
        };
        commServer.callCommServer(payload2, 'groups/' + data.adid, 'PUT')
        .then(
          function(response){
            res.json({"error": false, "message": data});
          },
          errorCallback
        );
      },
      errorCallback
    );
  }

// Private Functions

function errorCallback(error){
  logger.debug({"error": true, "message": "Something went wrong: " + error.statusCode});
}

// Export Functions

module.exports.deleteNode = deleteNode;
module.exports.updateNode = updateNode;
