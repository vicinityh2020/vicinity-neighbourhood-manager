// Global Objects

var mongoose = require('mongoose');
var commServer = require('../../services/commServer/request');
var myItems = require('../../services/items/deleteItems');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../services/audit/audit');

// Public functions

/*
Change node status to deleted in MONGO
Remove node from commServer
Remove all oids under node from commServer AND MONGO
*/
function deleteNode(adids, email, userId){

  return new Promise(function(resolve, reject) {
    if(adids.length > 0){ // Check if there is any item to delete
      sync.forEachAll(adids,
        function(value, allresult, next, otherParams) {
          deletingNodes(value, otherParams, function(value, result) {
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === adids.length){
            resolve(JSON.stringify(allresult));
          }
        },
        false,
        {userMail:email, userId: userId}
      );
    } else {
      reject("Nothing to be removed...");
    }
  });
}

/*
On node saved successfully in MONGO,
the update process continues in the commServer
*/
  function updateNode(data, email, userId){
    return new Promise(function(resolve, reject) {
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
          return commServer.callCommServer(payload2, 'groups/' + data.adid, 'PUT');
        })
        .then(function(response){ return nodeOp.findOne({adid: data.adid}); })
        .then(
          function(response){
            return audits.create(
              { kind: 'user', item: userId, extid: email },
              { kind: 'userAccount', item: response.cid.id, extid: response.cid.extid },
              { kind: 'node', item: response._id, extid: response.adid },
              23, null);
          })
        .then(function(response){
          resolve(response);
        })
        .catch(function(err){
          reject(err);
        });
      });
  }

// Private Functions

/*
Deletes all node asynchronously
*/
function deletingNodes(adid, otherParams, callback){
  var aux = {};
  var itemsRes;
  var query = {
    status: 'deleted',
    hasItems: [],
    cid: {}
  };
  nodeOp.findOne({adid: adid})
  .then(
  function(response){
    aux = response;
    return nodeOp.update({adid:adid},{$set:query});
  })
  .then(function(response){
    return userAccountOp.update({_id: aux.cid.id}, {$pull: {hasNodes: { id: aux._id }}});
  })
  .then(
  function(response){
    return audits.create(
      { kind: 'user', item: otherParams.userId, extid: otherParams.userMail },
      { kind: 'userAccount', item: aux.cid.id, extid: aux.cid.extid },
      { kind: 'node', item: aux._id, extid: aux.adid },
      22, null);
  })
  .then(function(response){
    var things = [];
    getOids(aux.hasItems, things);
    return myItems.deleteItems(things, otherParams.userMail, aux.type[0]); })
  .then(function(response){
    itemsRes = response;
  return commServer.callCommServer({}, 'users/' + adid, 'DELETE'); // Update node in commServer
  })
  .then(function(response){
    return commServer.callCommServer({}, 'groups/' + adid, 'DELETE'); })
  .then(function(response){
    callback(adid, {'status':'success', 'items': itemsRes}) ;
  })
  .catch(function(error){
    if (error.statusCode !== 404){
      callback(adid, {'status':'error'});
    } else {
      commServer.callCommServer({}, 'groups/' + adid, 'DELETE');
      callback(adid, {'status':'success', 'items': itemsRes}) ;
    }
  });
}

// Private functions

function getOids(array, things){
  for(var i = 0; i < array.length; i++){
    things.push(array[i].extid);
  }
}

// Export Functions

module.exports.deleteNode = deleteNode;
module.exports.updateNode = updateNode;
