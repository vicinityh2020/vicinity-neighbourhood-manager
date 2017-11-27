
// Global Objects

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var commServer = require('../../helpers/commServer/request');
var semanticRepo = require('../../helpers/semanticRepo/request');
var sync = require('../../helpers/asyncHandler/sync');


// Public functions

/*
Deletes either a selection of oids or all oids under a node
*/
function deleteItems(oids){
  return new Promise(function(resolve, reject) {
    if(oids.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      sync.forEachAll(oids,
        function(value, allresult, next) {
          deleting(value, function(value, result) {
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
        false
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
function deleting(oid, callback){
  logger.debug('START execution with value =', oid);
  var obj = {
    info: {},
    avatar: "",
    accessLevel: 0,
    hasAdministrator: [],
    hasAccess: [],
    status: 'deleted'
  };
  itemOp.findOneAndUpdate({oid:oid}, { $set: obj }, {new: true},
    function(err,data){
      if( err || !data ){
        logger.debug("Something went wrong: " + err);
        callback(oid, "error mongo" + err);
      } else {
        nodeOp.update({adid: data.adid}, {$pull: {hasItems: oid}}, function(err,agent){
          if(err){
            logger.debug("Something went wrong: " + err);
            callback(oid, "error mongo" + err);
          } else {
            commServer.callCommServer({}, 'users/' + oid, 'DELETE')
            .then(function(response){return semanticRepo.removeItem(oid);})
            .then(function(ans){callback(oid, "Success");})
            .catch(function(err){callback(oid, 'Error: ' + err);});
          }
        });
      }
    });
  }

// Export modules

module.exports.deleteItems = deleteItems;
