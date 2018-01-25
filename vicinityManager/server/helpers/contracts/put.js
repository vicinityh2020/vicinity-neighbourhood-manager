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
// TODO Create audit
*/
function acceptContract(req, res){
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
    return sharingRules.addItemsToContract(updItem, items);
  })
  .then(function(response){
    var notification = new notificationOp();
    notification.addressedTo.push(updItem.serviceProvider.cid.id, updItem.iotOwner.cid.id);
    notification.sentBy = data.serviceProvider.cid.id;
    // notification.userId = data.serviceProvider.uid.id;
    notification.ctId = updItem._id;
    notification.type = 24;
    notification.status = 'info';
    return notification.save();
  })
  .then(function(response){
    return audits.putAuditInt(
      updItem.iotOwner.cid.id,
      { orgOrigin: updItem.serviceProvider.cid,
        orgDest: updItem.iotOwner.cid,
        auxConnection: {kind: 'contract', item: updItem._id, extid: updItem.ctid},
        eventType: 51 }
    );
  })
  .then(function(response){
    return audits.putAuditInt(
      updItem.serviceProvider.cid.id,
      { orgOrigin: updItem.serviceProvider.cid,
        orgDest: updItem.iotOwner.cid,
        auxConnection: {kind: 'contract', item: updItem._id, extid: updItem.ctid},
        eventType: 51 }
    );
  })
  .then(function(response){
    res.json({error: false, message: updItem});
  })
  .catch(function(error){
    logger.debug(error);
    res.json({error: true, message: error});
  });
}


function modifyContract(req, res){
}

// Private Functions

function getOnlyOid(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i].extid);
  }
}

// Export modules
module.exports.acceptContract = acceptContract;
module.exports.modifyContract = modifyContract;
