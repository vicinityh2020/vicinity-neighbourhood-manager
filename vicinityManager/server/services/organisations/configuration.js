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
// var audits = require('../../services/audit/audit');

// Public functions

function get(cid, callback) {
  companyAccountOp.findById(cid, {skinColor: 1}, function(err, data){
    if (err) { callback(true, err); } else { callback(false, data); }
  });
}

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
  var cid = mongoose.Types.ObjectId(req.params.id);
  var uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var mail = req.body.decoded_token.sub;
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
          // Remove cid from friends knows array
          return companyAccountOp.update({"_id": {$in: friends}}, {$pull: {knows: {id: cid} }}, {multi: true});
        })
        .then(function(response){
            // When deleting a node all items under
          return myNode.deleteNode(nodes, mail);
        })
        .then(function(response){
          deletingResults.nodes = response;
          // Users are the last thing to be removeFriend
          // To remove a user it cannot have any item or contract under
          return delUser.deleteAllUsers(users, mail);
        })
        .then(function(response){
          deletingResults.users = response;
          // TODO uncomment/comment next 8 lines to test or have real behaviour
          companyData.location = "";
          companyData.hasNotifications = [];
          companyData.hasNodes = [];
          companyData.knows = [];
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
    }
  );
}

// Private functions

function removeContracts(users, uid, mail){
  var contracts = [];
  return new Promise(function(resolve, reject) {
    userOp.find({"_id": {$in: users}}, {hasContracts: 1})
    .then(function(response){
      for(var i = 0, l = response.length; i < l; i++){
        for(var j = 0, k = response.length; j < k; j++){
          contracts.push(response[i].hasContracts[j].id);
        }
      }
      var uniqueContracts = [];
      getUnique(uniqueContracts, contracts);
      for(var ii = 0, ll = uniqueContracts.length; ii < ll; ii ++){
        sContracts.removeAllContract(uniqueContracts[ii], uid, mail);
      }
      resolve(true);
    })
    .catch(function(err){
      resolve(err);
    });
  });
}

function getUnique(uniqueContracts, contracts){
  for(var i = 0, l = contracts.length; i < l; i ++){
    if(uniqueContracts.indexOf(contracts[i]) === -1){
      uniqueContracts.push(contracts[i]);
    }
  }
}


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
