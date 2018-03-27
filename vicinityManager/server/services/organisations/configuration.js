/*
This module contains management utilities for the userAccount (Organisation level)
get: get properties (main theme color)
set: set properties (main theme color)
remove: remove organisation
*/

// Global objects
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var companyAccountOp = require('../../models/vicinityManager').userAccount;
var delUser = require('../../services/users/deleteUsers');
var myNode = require('../../services/nodes/processNode');
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
function remove(cid, mail, callback) {
  var deletingResults = {};

  logger.debug('Removing organisation... ' + cid);

  companyAccountOp.findOne({ _id: cid },
    function(err, companyData){
      if (err) {
        callback(true, err);
      } else {
        var companyDataParsed = companyData.toObject();
        var users = [];
        getOids(companyDataParsed.accountOf, users, 'id');
        delUser.deleteAllUsers(users, mail)
        .then(function(response){
          deletingResults.users = response;
          var nodes = [];
          getOids(companyDataParsed.hasNodes, nodes, 'extid');
          return myNode.deleteNode(nodes, mail);
        })
        .then(function(response){
          deletingResults.nodes = response;
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
        // .then(function(response){ // TODO Decide if necessary - Nobody to log the audit to
        //   return audits.putAuditInt(
        //     cid,
        //     { orgOrigin: companyData.cid, // extid
        //       user: mail,
        //       eventType: 2 }
        //   );
        // })
        .then(function(response){
          deletingResults.organisation = {cid: cid, result: 'Success'};
          logger.audit({user: mail, action: 'deleteOrganisation', item: cid });
          logger.debug('Success deleting organisation!!!');
          logger.debug({result: deletingResults});
          callback(false, deletingResults);
        })
        .catch(function(err){
          logger.error({user: mail, action: 'deleteOrganisation', item: cid, message: err});
          callback(true, err);
        });
      }
    }
  );
}

// Private functions

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
