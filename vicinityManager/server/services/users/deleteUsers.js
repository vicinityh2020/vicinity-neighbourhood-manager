// Global Objects

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logger');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../controllers/audit/put');

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
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === users.length){
            // logger.debug('Completed async handler: ' + JSON.stringify(allresult));
              resolve(allresult);
          }
        },
        false,
        { userMail : mail }
      );
    } else {
      logger.warn({user:mail, action: 'deleteUser', message: "No users to be removed"});
      reject("Nothing to be removed...");
    }
  });
}

// Checks if the user belongs to my org and thus I can delete it
function isMyUser(cid, uid){
  return new Promise(function(resolve, reject) {
    userOp.findOne({_id: uid}, {cid:1},function(err, response){
      if(err){
        reject(err);
      } else if(response.cid.id.toString() === cid.toString()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
// Private functions

/*
Delete == Remove relevant fields and change status to removed
Need to keep some fields for auditing purposes
*/
function deleting(id, otherParams, callback){
  //logger.debug('START execution with value =', id);
  var cid;
  var obj = {
    avatar: "",
    occupation: "",
    location: "",
    status: "deleted",
    authentication: {},
    hasItems: [],
    hasContracts: [],
    cid: {}
  };
  userOp.findOne({_id: id})
  .then(function(response){
    cid = response.cid;
    return userOp.update({_id: id}, { $set: obj });
  })
  .then(function(response){
    return audits.putAuditInt(
      cid.id,
      { orgOrigin: cid.extid,
        auxConnection: {kind: 'user', item: id},
        user: otherParams.userMail,
        eventType: 12 }
    );
  })
  .then(function(response){ return userAccountOp.update({_id: cid.id}, {$pull: {accountOf: { id: id }}}); })
  .then(function(response){
    logger.audit({user: otherParams.userMail, action: 'deleteUser', item: id });
    callback(id, "Success");
  })
  .catch(function(error){
    logger.error({user: otherParams.userMail, action: 'deleteUser', item: id, message: JSON.stringify(error)});
    callback(id, "Error: " + error);
  });
}

// Export modules

module.exports.deleteAllUsers = deleteAllUsers;
module.exports.isMyUser = isMyUser;
