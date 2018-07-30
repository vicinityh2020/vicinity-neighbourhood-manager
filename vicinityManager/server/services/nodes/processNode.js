// Global Objects

var mongoose = require('mongoose');
var logger = require('../../middlewares/logger');
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
      logger.debug('Start async handler...' + adids);
      sync.forEachAll(adids,
        function(value, allresult, next, otherParams) {
          deletingNodes(value, otherParams, function(value, result) {
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === adids.length){
            // logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {userMail:email, userId: userId}
      );
    } else {
      logger.warn({user: email, action: 'deleteNodes', message: "No nodes found to be removed"});
      resolve({"error": false, "message": "Nothing to be removed..."});
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
          logger.audit({user: email, action: 'updateNode', item: response._id });
          resolve('Success');
        })
        .catch(function(err){
          logger.error({user: email, action: 'updateNode', item: response._id, message: err});
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
    logger.audit({user: otherParams.userMail, action: 'deleteNodes', item: adid });
    callback(adid, {'status':'success', 'items': itemsRes}) ;
  })
  .catch(function(error){
    if (error.statusCode !== 404){
      logger.error({user: otherParams.userMail, action: 'deleteNodes', item: adid, message: error});
      callback(adid, 'error');
    } else {
      commServer.callCommServer({}, 'groups/' + adid, 'DELETE');
      logger.warn({user: otherParams.userMail, action: 'deleteNodes', item: adid, message: 'Node not found in comm server' });
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
