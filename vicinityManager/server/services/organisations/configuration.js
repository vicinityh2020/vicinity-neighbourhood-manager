/*
This module contains management utilities for the userAccount (Organisation level)
get: get properties (main theme color)
set: set properties (main theme color)
remove: remove organisation
*/

// Global objects
var mongoose = require('mongoose');
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;
var delUser = require('../../services/users/deleteUsers');
var myNode = require('../../services/nodes/processNode');
var sContracts = require('../../services/contracts/contracts');
var uuid = require("uuid");

// Public functions

/*
  Get property color of the user interface
*/
function get(cid, callback) {
  companyAccountOp.findById(cid, {skinColor: 1}, function(err, data){
    if (err) { callback(true, err); } else { callback(false, data); }
  });
}

/*
  Set property color of the user interface
*/
function put(cid, update, callback) {
  companyAccountOp.update({ _id: cid }, { $set: update }, function(err, data){
    if (err) { callback(true, err); } else { callback(false, 'Successfully updated'); }
  });
}

/*
Removes organisation and everything under:
Users, nodes, items
*/
function remove(req, res, callback) {
  try{
    if(req.body.decoded_token){
      req.body.decoded_token.sub = req.body.decoded_token.sub || null;
      req.body.decoded_token.uid = req.body.decoded_token.uid || null;
    } else {
      req.body = {};
      req.body.decoded_token = {sub : null, uid: null};
    }
    var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
    var mail = req.body.decoded_token.sub;

    // Start final result info object
    var deletingResults = {};
    deletingResults.info = { action: "Organisation deleted", actor: mail};

    companyAccountOp.findOne({ _id: cid },
      function(err, companyData){
        if (err) {
          callback(true, err);
        } else {
          var companyDataParsed = companyData.toObject();
          var friends = [];
          var users = [];
          var nodes = [];
          getOids(companyDataParsed.knows, friends, 'id');
          getOids(companyDataParsed.accountOf, users, 'id');
          getOids(companyDataParsed.hasNodes, nodes, 'extid');

          removeContracts(users, uid, mail)
          .then(function(response){
            deletingResults.contracts = response;
            // Remove cid from friends knows arrays
            return companyAccountOp.update({"_id": {$in: friends}}, {$pull: {knows: {id: cid} }}, {multi: true});
          })
          .then(function(response){
              // When deleting a node all items under
            return myNode.deleteNode(nodes, req, res);
          })
          .then(function(response){
            deletingResults.nodes = response;
            // Users are the last thing to be removeFriend
            // To remove a user it cannot have any item or contract under
            return delUser.deleteAllUsers(users, req, res);
          })
          .then(function(response){
            deletingResults.users = response;
            // TODO uncomment/comment next 8 lines to test or have real behaviour
            companyData.location = "";
            companyData.name = companyDataParsed.name + ":" + uuid();
            companyData.hasNotifications = [];
            companyData.hasNodes = [];
            companyData.knows = [];
            companyData.hasAudits = [];
            companyData.knowsRequestsTo = [];
            companyData.knowsRequestsFrom = [];
            companyData.avatar = "";
            companyData.status = "deleted";
            return companyData.save();
          })
          .then(function(response){
            deletingResults.organisation = {cid: cid, result: 'Success'};
            callback(false, deletingResults);
          })
          .catch(function(err){
            callback(true, err);
          });
        }
      });
    } catch(err) {
      callback(true, err);
    }
  }

// Private functions

// Extract unique company contracts and remove them
function removeContracts(users, uid, mail){
  var contracts = [];
  var uniqueContracts = [];
  return new Promise(function(resolve, reject) {
    userOp.find({"_id": {$in: users}}, {hasContracts: 1})
    .then(function(response){
      for(var i = 0, l = response.length; i < l; i++){
        for(var j = 0, k = response[i].hasContracts.length; j < k; j++){
          contracts.push(response[i].hasContracts[j].extid);
        }
      }
      getUnique(uniqueContracts, contracts);
      var contractsToDel = [];
      for(var ii = 0, ll = uniqueContracts.length; ii < ll; ii ++){
        contractsToDel.push(sContracts.removeAllContract(uniqueContracts[ii], uid, mail));
      }
      return Promise.all(contractsToDel);
    })
    .then(function(response){
      resolve(uniqueContracts);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

// Keep unique values in the array
function getUnique(uniqueContracts, contracts){
  for(var i = 0, l = contracts.length; i < l; i++){
    if(uniqueContracts.indexOf(contracts[i]) === -1){
      uniqueContracts.push(contracts[i]);
    }
  }
}

// Extract properties from and object array
// output: array with that properties
function getOids(array, friends, type){
  var aux;
  for(var i = 0; i < array.length; i++){
    aux = array[i];
    friends.push(aux[type]);
  }
}


// Export Functions
module.exports.get = get;
module.exports.put = put;
module.exports.remove = remove;
