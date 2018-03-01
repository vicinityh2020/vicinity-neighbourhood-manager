// Global Objects

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logger');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../controllers/audit/put');
var commServer = require('../../services/commServer/request');
var ctService = require('../../services/contracts/contracts');

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
  userOp.findOne({_id: id}, {cid:1, hasItems:1}).populate('hasItems.id', 'cid oid')
  .then(function(response){
    var aux = response.toObject();
    var toDisable = [];
    cid = aux.cid;
    for(var i = 0; i < aux.hasItems.length; i++){
      toDisable.push(aux.hasItems[i].id);
    }
    disableUserItems(toDisable, otherParams.userMail)
    .then(function(response){ logger.debug('Disable items finished'); })
    .catch(function(err){ logger.debug('Disable items error: ' + err); });

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

/*
Disables all user items when the user is removed
*/
function disableUserItems(items, mail){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      // logger.debug('Start async handler...');
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          disabling(value, otherParams, function(value, result) {
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({error: value, message: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === items.length){
            // logger.debug('Completed async handler: ' + JSON.stringify(allresult));
              resolve(allresult);
          }
        },
        false,
        {mail: mail}
      );
    } else {
      logger.warn({user:mail, action: 'deleteUser', message: "No items to be removed"});
      reject("Nothing to be removed...");
    }
  });
}

// Disables devices one by one
function disabling(data, otherParams, callback){
  commServer.callCommServer({}, 'users/' + data.oid + '/groups/' + data.cid.extid + '_ownDevices', 'DELETE')
    .then(function(response){
     var query = {status: 'disabled', accessLevel: 0};
     return itemOp.update({ _id : data._id}, {$set: query});
   })
   .then(function(response){
     return itemOp.findOne({ _id : data._id}).populate('cid.id', 'knows');
   })
   .then(function(response){
     item = response.toObject();
     ctService.removeDevice(item, {}, function(err, response){
       if(!err){
         logger.audit({user: otherParams.mail, action: 'DisableItem', item: data._id });
         callback(false, response);
       } else {
         logger.error({user: otherParams.mail, action: 'DisableItem', item: data._id, message: err});
         callback(true, err);
       }
     });
   });
}

// Export modules

module.exports.deleteAllUsers = deleteAllUsers;
module.exports.isMyUser = isMyUser;
