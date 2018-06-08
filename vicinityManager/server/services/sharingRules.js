// Global objects and variables ================================

var mongoose = require('mongoose');
var itemOp = require('../models/vicinityManager').item;
var userAccountOp = require('../models/vicinityManager').userAccount;
var contractOp = require('../models/vicinityManager').contract;
var logger = require('../middlewares/logger');
var sync = require('../services/asyncHandler/sync');
var commServer = require('../services/commServer/request');
var ctChecks = require('../services/contracts/contractChecks.js');
var audits = require('../services/audit/audit');

// Public functions ================================

/*
A device changes its accessLevel
I need to remove/add from/to the commServer groups accordingly
*/
function changePrivacy(ids, userId, userMail, c_id){
  var cont = 0;
  var knows = [];
  return new Promise(function(resolve, reject) {
    userAccountOp.findOne({_id:c_id}, {knows:1}, function(err, response){
      if(err){reject(err);}
      if(!response){resolve('Nothing to be done...');}
      if(response.knows != 'undefined' || response.knows.length > 0){
        getOnlyId(knows, response.knows);
      }
      sync.forEachAll(ids,
        function(value, allresult, next, otherParams) {
          processingPrivacy(value, otherParams, function(toContinue, array) {
            if(toContinue){
              for(var i = 0; i < array.length; i++){
                allresult.push(array[i]);
              }
            }
            cont++;
            next();
          });
        },
        function(allresult) {
          if(cont === ids.length){
            // ctChecks.checkContracts(allresult, userId, userMail)
            // .then(function(response){
            resolve('Success');
            // })
            // .catch(function(error){
            //   logger.debug(error);
            //   reject(error);
            // });
          }
        },
        false,
        {knows:knows}
      );
    });
  });
}

/*
An organisation stops being my partner
I need to remove my devices with friend data access Level
To do so, I remove the group which shares with my friend and the group which
my friend is using to share with me.
*/
function removeFriend(my_id, friend_id, email, uid){
  logger.debug('removing friend');
  var items1, items2;
  var items = [];
  return new Promise(function(resolve, reject) {
    itemOp.find({'cid.id':my_id, accessLevel: 1, 'hasContracts.contractingParty':friend_id}, {cid:1})
    .then(function(response){
      if(response){ items1 = response; }
      return itemOp.find({'cid.id':friend_id, accessLevel: 1, 'hasContracts.contractingParty':my_id}, {cid:1});
    })
    .then(function(response){
      if(response){ items2 = response; }
      if(items1.length > 0){
        for(var i = 0; i < items1.length; i++){
          items.push(items1[i]._id);
        }
        return changePrivacy(items, uid, email, my_id);
      } else { return true; }
    })
    .then(function(response){
      if(items2.length > 0){
        items = [];
        for(var j = 0; j < items2.length; j++){
          items.push(items2[j]._id);
        }
        return changePrivacy(items, uid, email, friend_id);
      } else { return true; }
    })
    .then(function(response){
      resolve({error: false, message: 'Success'});
    })
    .catch(function(error){
      logger.debug('Error remove friend: ' + error);
      reject({error: true, message: error});
    });
  });
}

/*
A user changes its access level
I need check that all devices have an AL below users AL
If not, I need to update all items and contracts accordingly
*/
function changeUserAccessLevel(uid, newAccessLevel, email){
  var ids = [];
  var c_id;
  return new Promise(function(resolve, reject) {
    itemOp.find({'uid.id':uid, accessLevel: {$gt: newAccessLevel}}, {cid:1})
    .then(function(items){
      if(items.length > 0){
        c_id = items[0].cid.id;
        for(var i = 0; i < items.length; i++){
          ids.push(items[i]._id);
        }
        logger.debug(ids);
        return itemOp.update({_id: {$in: ids}}, {$set: {accessLevel: newAccessLevel}}, {multi:true});
      } else {
        return false;
      }
    })
    .then(function(response){
      if(!response){
        return false;
      } else {
        return changePrivacy(ids, uid, email, c_id);
      }
    })
    .then(function(response){
      if(!response){
        resolve({error: false, message: 'Nothing to update'});
      } else {
        resolve({error: false, message: 'success'});
      }
    })
    .catch(function(error){
      logger.debug('Error remove friend: ' + error);
      reject({error: true, message: error});
    });
  });
}



// Private functions ================================

/*
Checking each item privacy change
*/
function processingPrivacy(id, otherParams, callback){
  logger.debug('processing...');
  var knows = otherParams.knows || [];
  var cts_id = [];
  var cts_ctid = [];
  var typeOfItem, oid, contracts;
  var flag1, flag2;
  itemOp.findOne({_id: id},{hasContracts:1, oid:1, cid:1, accessLevel:1, typeOfItem:1})
  .then( function(response){
    oid = response.oid;
    typeOfItem = response.typeOfItem;
    contracts = response.hasContracts;
    if(contracts.length === 0){
      callback(false, {});
    } else {
      for(var i = 0; i < contracts.length; i++){
        flag1 = response.accessLevel === 0;
        if(knows.length > 0){
          flag2 = knows.indexOf(contracts[i].contractingParty) === -1 && response.accessLevel === 1;
        } else {
          flag2 = response.accessLevel !== 2;
        }
        if(flag1 || flag2){
          cts_id.push(contracts[i].id);
          cts_ctid.push(contracts[i].extid);
        }
      }
      if(cts_id.length === 0){ callback(false, {}); }
      return cts_id;
    }
  })
  .then(function(response){
    return itemOp.update(
      {_id: id},
      {$pull: {"hasContracts": {id: {$in: cts_id }}}},
      {multi:true}
    );
  })
  .then(function(response){
    return contractOp.update(
      {_id: {$in: cts_id }},
      {$pull: {"iotOwner.items": {id:id}}},
      {multi:true}
    );
  })
  .then(function(response){
    return contractOp.update(
      {_id: {$in: cts_id }},
      {$pull: {"foreignIot.items": {id:id}}},
      {multi:true}
    );
  })
  .then(function(response){
    return updateCommServer(cts_ctid, oid);
  })
  .then(function(response){
    callback(true, cts_id);
  })
  .catch(function(error){
    logger.debug(error);
    callback(false, {}); // Do error control
  });
}

/*
Async update commserver groups to adapt to privacy changes
*/
function updateCommServer(cts, oid){
  var cont = 0;
  return new Promise(function(resolve, reject) {
    sync.forEachAll(cts,
      function(ctid, allresult, next, otherParams) {
        commServer.callCommServer({}, 'users/' + otherParams.oid + '/groups/' + ctid, 'DELETE')
        .then(function(response){
          allresult.push({error: false, ctid: ctid});
          cont++;
          next();
        })
        .catch(function(err){
          logger.debug(err);
          allresult.push({error: true, ctid: ctid});
          cont++;
          next();
        });
      },
      function(allresult) {
        if(cont === cts.length){
          resolve('Success');
        }
      },
      false,
      {oid: oid}
    );
  });
}

/* get ids */
function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id.toString());
  }
}

// Function exports ================================

module.exports.changePrivacy = changePrivacy;
module.exports.changeUserAccessLevel = changeUserAccessLevel;
module.exports.removeFriend = removeFriend;
