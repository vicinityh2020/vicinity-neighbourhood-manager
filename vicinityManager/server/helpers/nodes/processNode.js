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
function deleteNode(id, items, res){

    commServer.callCommServer({}, 'users/' + id, 'DELETE') // Update node in commServer
    .then(
      function(response){
        commServer.callCommServer({}, 'groups/' + id, 'DELETE')
        .then(
          function(response){
            // logger.debug(items);
            var query = {
              'status': 'deleted',
              'name': 'empty'
            }
            nodeOp.update({_id: id}, { $set: query });
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
    commServer.callCommServer(payload, 'users/' + data._id, 'PUT') // Update node in commServer
    .then(
      function(response){
        res.json({"error": false, "message": data});
      },
      errorCallback
    );
  }

// Private Functions

function errorCallback(error){
  res.json({"error": true, "message": "Something went wrong: " + error.statusCode});
}

// Export Functions

module.exports.deleteNode = deleteNode;
module.exports.updateNode = updateNode;
