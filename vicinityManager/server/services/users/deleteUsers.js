// Global Objects

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logBuilder');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../services/audit/audit');
var commServer = require('../../services/commServer/request');
var ctService = require('../../services/contracts/contracts');
var uuid = require('uuid');

// Public functions

/*
Deletes a selection of users
Users to be removed pass their ids in an array as parameter
*/
function deleteAllUsers(users, req, res){
  return new Promise(function(resolve, reject) {
    if(users.length > 0){ // Check if there is any item to delete
      sync.forEachAll(users,
        function(value, allresult, next, otherParams) {
          deleting(value, otherParams, function(value, result) {
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === users.length){
            resolve(allresult);
          }
        },
        false,
        { req : req, res: res }
      );
    } else {
      logger.log(req, res, {type: 'debug', data: "Nothing to be removed"});
      reject("Nothing to be removed");
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
  var userMail = otherParams.req.body.decoded_token.sub;
  var userId = otherParams.req.body.decoded_token.uid;
  var cid;
  var aux;
  var obj = {
    avatar: "",
    occupation: "",
    location: "",
    status: "deleted",
    authentication: {},
    hasItems: [],
    hasContracts: [],
    hasAudits: [],
    cid: {}
  };
  userOp.findOne({_id: id}, {cid:1, hasItems:1, hasContracts: 1, email:1})
  .then(function(response){
    aux = response.toObject();
    cid = aux.cid;
    if(aux.hasItems.length + aux.hasContracts.length > 0){
      return new Promise(function(resolve, reject) { reject('User has items or contracts'); });
    } else {
      obj.name = aux.name + ":" + uuid();
      return userOp.update({_id: id}, { $set: obj });
    }
  })
  .then(function(response){
    return audits.create(
      { kind: 'user', item: userId , extid: userMail },
      { kind: 'userAccount', item: cid.id, extid: cid.extid },
      { kind: 'user', extid: aux.email },
      12, null);
  })
  .then(function(response){ return userAccountOp.update({_id: cid.id}, {$pull: {accountOf: { id: id }}}); })
  .then(function(response){
    logger.log(otherParams.req, otherParams.res, {type: 'audit', data: {user: userMail, action: 'deleteUser', item: id }});
    callback(id, "Success");
  })
  .catch(function(error){
    if(error === "User has items or contracts"){
      logger.log(otherParams.req, otherParams.res, {type: 'warn', data: error});
    }
    callback(id, error);
  });
}

// Export modules

module.exports.deleteAllUsers = deleteAllUsers;
module.exports.isMyUser = isMyUser;
