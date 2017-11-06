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
var delUser = require('../../helpers/users/deleteUsers');
var myNode = require('../../helpers/nodes/processNode');


// Public functions

function get(req, res, next) {
  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  companyAccountOp.findById(cid, {skinColor: 1}, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

function put(req, res, next) {
  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  var update = req.body;
  logger.debug(JSON.stringify(update));
  companyAccountOp.update({ _id: cid }, { $set: update },
    function(err, data){
      if (err) {
        response =  {"error": true, "message": "Error fetching data: " + err};
      } else {
        response = {"error": false, "message": "Successfully updated!"};
      }
      res.json(response);
    }
  );
}

/*
Removes organisation and everything under:
Users, nodes, items
*/
function remove(req, res, next) {
  var deletingResults = {};
  var cid = mongoose.Types.ObjectId(req.params.id);

  logger.debug('Removing organisation... ' + cid);

  companyAccountOp.findOne({ _id: cid },
    function(err, companyData){
      if (err) {
        res.json({"error": true, "message": "Error fetching data: " + err});
      } else {
        delUser.deleteAllUsers(companyData.accountOf)
        .then(function(response){
          deletingResults.users = response;
          return myNode.deleteNode(companyData.hasNodes);
        })
        .then(function(response){
          deletingResults.nodes = response;
          // TODO uncomment/comment next 8 lines to test or have real behaviour
          companyData.location = "";
          companyData.organisation = "";
          companyData.businessId = "";
          companyData.hasNotifications = [];
          companyData.knows = [];
          companyData.knowsRequestsTo = [];
          companyData.knowsRequestsFrom = [];
          companyData.avatar = "";
          companyData.status = "deleted";
          return companyData.save();
        })
        .then(function(response){
          deletingResults.organisation = {cid: cid, result: 'Success'};
          logger.debug('Success deleting organisation!!!');
          logger.debug({result: deletingResults});
          res.json(deletingResults);
        })
        .catch(function(err){res.json({error: true, message: err}); });
      }
    }
  );
}

// Export Functions
module.exports.get = get;
module.exports.put = put;
module.exports.remove = remove;
