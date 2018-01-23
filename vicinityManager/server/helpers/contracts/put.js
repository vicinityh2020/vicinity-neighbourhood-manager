// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../routes/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var notificationOp = require('../../models/vicinityManager').notification;
var sharingRules = require('../../helpers/sharingRules');

/*
Modify contract
- Only modification possible right now is the agreement on the contract
// TODO Create notification
// TODO Create audit
*/
function modifyContract(req, res){
  var id = req.params.id;
  var updItem = {};
  var query = { $set: {"serviceProvider.termsAndConditions": true, status: 'accepted'} };
  contractOp.findOneAndUpdate( { "_id": id}, query, {new: true})
  .then(function(response){
    updItem = response.toObject(); // Get rid of metadata
    return sharingRules.createContract(updItem.ctid, 'Contract: ' + updItem.type);
  })
  .then(function(response){
    var items = [];
    getOnlyOid(items, updItem.serviceProvider.items);
    getOnlyOid(items, updItem.iotOwner.items);
    logger.debug(items);
    return sharingRules.addItemsToContract(updItem.ctid, items);
  })
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(error){
    res.json({error: true, message: error});
  });
}

// Private Functions

function getOnlyOid(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i].extid);
  }
}

// Export modules
module.exports.modifyContract = modifyContract;
