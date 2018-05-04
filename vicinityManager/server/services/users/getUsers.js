// Global variables and packages
var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

// Public functions

/*
Gets user information
Receives following parameters:
- Target UID
- Requester UID and CID
*/
function getUserInfo(uid, myUid, myCid, callback) {
  userAccountOp.findOne({_id: myCid}, {accountOf:1})
  .then(function(response){
    if(!response){
      callback(false, 'Wrong cid provided...');
    } else {
      if(uid.toString() === myUid.toString()){ // Checking own info
        userOp.findOne({_id:uid}, {name:1, email:1, cid:1, occupation:1, accessLevel:1, hasItems:1, hasContracts:1}, function(err, response){
          if(err){ callback(true, err); } else { callback(false, response); }
          callback(false, response);
        });
      } else {
        var users = [];
        getIds(response.accountOf, users);
        if(users.indexOf(uid) !== -1){
          userOp.findOne({_id:uid}, {name:1, email:1, cid:1, occupation:1, accessLevel:1, hasItems:1, hasContracts:1}, function(err, response){
            if(err){ callback(true, err); } else { callback(false, response); }
          });
        } else {
          callback(false, 'Unauthorized');
        }
      }
    }
  })
  .catch(function(err){
    callback(true, err);
  });
}

function getOne(o_id, callback) {
  userOp.findById(o_id, {'authentication.hash':0},function(err, data){
    if (err) {
      logger.debug(err);
      callback(true, err);
    } else {
      callback(false, data);
    }
  });
}

function getAll(othercid, mycid, callback) {
  var friends = [], users = [];
  userAccountOp.findById(othercid, {knows:1, 'accountOf.id':1}).populate('accountOf.id', 'avatar name email occupation authentication.principalRoles location status accessLevel')
  .then(function(response){
    var parsedData = response.toObject();
    friends = parsedData.knows;
    users = parsedData.accountOf;
    var relation = myRelationWithOther(mycid, othercid, friends);
    if(relation === 1){
      users = users.filter(function(i){return i.id.accessLevel >= 1;});
    } else if(relation === 2){
      users = users.filter(function(i){return i.id.accessLevel === 2;});
    } else {}
    callback(false, users);
  })
  .catch(function(error){
    logger.debug(error);
    callback(true, error);
  });
}

// Private functions

function myRelationWithOther(a,b,c){
  var d = getIds(c);
  d = d.join();
  d = d.split(',');
  if(a.toString() === b.toString()){ return 0; } // Same company
  else if(d.indexOf(a.toString()) !== -1){ return 1; } // Friend company
  else { return 2; } // Other company
}

function getIds(array){
  var a = [];
  for(var i = 0; i < array.length; i++){
    a.push(array[i].id);
  }
  return a;
}

// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getUserInfo = getUserInfo;
