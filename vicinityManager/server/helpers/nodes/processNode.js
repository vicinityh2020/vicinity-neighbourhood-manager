// Global Objects

var mongoose = require('mongoose');
var logger = require('../../middlewares/logger');
var commServer = require('../../helpers/commServer/request');
var myItems = require('../../helpers/items/deleteItems');

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
            logger.debug(items);
            myItems.deleteItems(items, res);
          },
          function(error){
            res.json({"error": true, "message": "Something went wrong: " + error});
          }
        );
      },
      function(error){
        res.json({"error": true, "message": "Something went wrong: " + error});
      }
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
      function(error){
        logger.debug("Error updating the node: " + error);
        res.json({"error": true, "message": "Something went wrong: " + error.statusCode});
      }
    );
  }

// Private Functions


// Export Functions

module.exports.deleteNode = deleteNode;
module.exports.updateNode = updateNode;
