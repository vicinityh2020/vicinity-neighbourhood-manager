
// Global Objects

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var userOp = require('../../models/vicinityManager').user;
var logger = require('../../middlewares/logger');
var commServer = require('../../services/commServer/request');
var semanticRepo = require('../../services/semanticRepo/request');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../services/audit/audit');

// Public functions

/*
Deletes either a selection of oids or all oids under a node
*/
function deleteItems(oids, email){
  return new Promise(function(resolve, reject) {
    if(oids.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      sync.forEachAll(oids,
        function(value, allresult, next, otherParams) {
          deleting(value, otherParams, function(value, result) {
              logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === oids.length){
            logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {userMail:email}
      );
    } else {
      logger.warn({user:email, action: 'deleteItem', message: "No items to be removed"});
      resolve({"error": false, "message": "Nothing to be removed..."});
    }
  });
}

// Private functions

/*
Delete == Remove relevant fields and change status to removed
Make sure that agent is deleted or break connection with removed object
*/
function deleting(oid, otherParams, callback){
  logger.debug('START execution with value =', oid);
  var obj = {
    info: {},
    avatar: "",
    accessLevel: 0,
    status: 'deleted',
    cid: [],
    adid: [],
    hasContracts: []
  };
  itemOp.findOne({oid:oid}, {avatar:0},
    function(err,data){
      if(err){
        logger.debug("Something went wrong: " + err);
        callback(oid, "error mongo" + err);
      }else if(!data){
        logger.debug("Object does not exist");
        callback(oid, "Object does not exist");
      }else{
        var cid = data.cid;
        var id = data._id;

        itemOp.update({oid:oid}, {$set: obj})
        .then(function(response){ return nodeOp.update({_id: data.adid.id}, {$pull: {hasItems: { extid : oid }}}); })
        .then(function(response){ return userOp.update({_id: data.uid.id}, {$pull: {hasItems: { extid : oid }}}); })
        .then(function(response){ return semanticRepo.callSemanticRepo({}, "td/remove/" + oid, 'DELETE'); })
        .then(function(response){
          return audits.create(
            { kind: 'user', item: data.uid.id, extid: data.uid.extid },
            { kind: 'userAccount', item: data.cid.id, extid: data.cid.extid },
            { kind: 'item', item: data._id, extid: data.oid, name: data.name },
            42, null);
        })
        .then(function(response){ return commServer.callCommServer({}, 'users/' + oid, 'DELETE'); })
        .then(function(ans){
          logger.audit({user: otherParams.userMail, action: 'deleteItem', item: oid });
          callback(oid, "Success");})
        .catch(function(err){
          if(err.statusCode !== 404){
            logger.error({user: otherParams.userMail, action: 'deleteItem', item: oid, message: err});
            callback(oid, 'Error: ' + err);
          } else {
            logger.warn({user: otherParams.userMail, action: 'deleteItem', item: oid, message: 'Object did not exist in comm server' });
            callback(oid, "Success");
          }
        });
      }
    });
  }

// Export modules

module.exports.deleteItems = deleteItems;
