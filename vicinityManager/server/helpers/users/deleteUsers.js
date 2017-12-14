// Global Objects

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logger');
var sync = require('../../helpers/asyncHandler/sync');
var audits = require('../../routes/audit/put');

// Public functions

/*
Deletes a selection of users
Users to be removed pass their ids in an array as parameter
*/
function deleteAllUsers(users, mail){
  return new Promise(function(resolve, reject) {
    if(users.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      sync.forEachAll(users,
        function(value, allresult, next, otherParams) {
          deleting(value, otherParams, function(value, result) {
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
        false,
        { userMail : mail }
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
*/
function deleting(id, otherParams, callback){
  logger.debug('START execution with value =', id);
  var cid;
  var obj = {
    avatar: "",
    name: "",
    occupation: "",
    status: "deleted",
    authentication: {}
  };

  userOp.findOneAndUpdate({_id:id}, { $set: obj }, {new: true})
  .then(function(response){
    cid = response.organisation;
    return audits.putAuditInt(
      cid,
      { orgOrigin: cid,
        auxConnection: {kind: 'user', item: id},
        user: otherParams.userMail,
        eventType: 12 }
    );
  })
  .then(function(response){ return userAccountOp.update({_id: cid}, {$pull: {accountOf: id}}); })
  .then(function(response){ callback(id, "Success"); })
  .catch(function(error){
    logger.debug("Something went wrong: " + error);
    callback(id, "Error: " + error);
  });
}

// Export modules

module.exports.deleteAllUsers = deleteAllUsers;
