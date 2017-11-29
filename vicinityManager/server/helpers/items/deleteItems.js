
// Global Objects

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var commServer = require('../../helpers/commServer/request');
var semanticRepo = require('../../helpers/semanticRepo/request');
var sync = require('../../helpers/asyncHandler/sync');
var audits = require('../../routes/audit/put');

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
    hasAdministrator: [],
    hasAccess: [],
    status: 'deleted'
  };
  itemOp.findOne({oid:oid},
    function(err,data){
      if( err || !data ){
        logger.debug("Something went wrong: " + err);
        callback(oid, "error mongo" + err);
      } else {
        var cid = data.hasAdministrator[0];
        var id = data._id;

        itemOp.update({oid:oid}, {$set: obj})
        .then(function(response){ return nodeOp.update({adid: data.adid}, {$pull: {hasItems: oid}}); })
        .then(function(response){ return semanticRepo.removeItem(oid); })
        .then(function(response){
          return audits.putAuditInt(
            id,
            { orgOrigin: cid,
              user: otherParams.userMail,
              auxConnection: {kind: 'item', item: id},
              eventType: 42 }
          );
        })
        .then(function(response){
          return audits.putAuditInt(
            cid,
            { orgOrigin: cid,
              user: otherParams.userMail,
              auxConnection: {kind: 'item', item: id},
              eventType: 42 }
          );
        })
        .then(function(response){ return commServer.callCommServer({}, 'users/' + oid, 'DELETE'); })
        .then(function(ans){callback(oid, "Success");})
        .catch(function(err){
          if(err.statusCode !== 404){
            callback(oid, 'Error: ' + err);
          } else {
            callback(oid, "Success");
          }
        });
      }
    });
  }

// Export modules

module.exports.deleteItems = deleteItems;
