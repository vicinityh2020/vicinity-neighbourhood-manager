// Global Objects

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logger');
var sync = require('../../helpers/asyncHandler/sync');

// Public functions

/*
Deletes either a selection of oids or all oids under a node
*/
function deleteAllUsers(users){
  return new Promise(function(resolve, reject) {
    if(users.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      sync.forEachAll(users,
        function(value, allresult, next) {
          deleting(value, function(value, result) {
              logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === users.length){
            logger.debug('Completed async handler: ' + JSON.stringify(allresult));
              resolve(allresult);
          }
        },
        false
      );
    } else {
      reject("Nothing to be removed...");
    }
  });
}

// Private functions

/*
Delete == Remove relevant fields and change status to removed
Need to keep some fields for auditing purposes
TODO Uncomment below in order to have a real user removal function, right now is dummy for test purposes
*/
function deleting(id, callback){
  logger.debug('START execution with value =', id);
  var obj = {
    //avatar: "",
    //name: "",
    //occupation: "",
    status: "deleted",
    //authentication: {}
  };
  userOp.findOneAndUpdate({_id:id}, { $set: obj }, {new: true},
    function(err,data){
      if( err || !data ){
        logger.debug("Something went wrong: " + err);
        callback(id, "error mongo" + err);
      } else {
        // userAccountOp.update({_id: data.organisation}, {$pull: {accountOf: id}}, function(err,data){
        //   if(err){
        //     logger.debug("Something went wrong: " + err);
        //     callback(oid, "error mongo" + err);
        //   } else {
            callback(id, "Success");
        //   }
        // });
      }
    });
  }

// Export modules

module.exports.deleteAllUsers = deleteAllUsers;
