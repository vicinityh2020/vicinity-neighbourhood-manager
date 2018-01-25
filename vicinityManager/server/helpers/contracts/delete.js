// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../routes/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var notificationOp = require('../../models/vicinityManager').notification;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var sharingRules = require('../../helpers/sharingRules');

/*
Remove contract
// TODO Create notification
// TODO Create audit
*/
function removeContract(req, res){
  var id = req.params.id;
  removing(id, function(response, err){
    res.json({error: err, message: response});
  });
}

function removing(id, callback){
  var finalResp;
  var data = {};
  var idsDevice = [];
  var idsService = [];
  var cidService = "";
  var cidDevice = "";
  var ctid = {};
  var uidService = "";
  var uidDevice = "";

  var query = {
    serviceProvider:{},
    iotOwner:{},
    legalDescription: "",
    status: 'deleted'
    };

  contractOp.findOne({_id:id})
  .then(function(response){
    data = response.toObject(); // Get rid of metadata
    return contractOp.update({_id:id}, {$set: query});
  })
  .then(function(response){
    return sharingRules.cancelContract(data.ctid);
  })
  .then(function(response){
    finalResp = response;
    cidService = data.serviceProvider.cid.extid;
    cidDevice = data.iotOwner.cid.extid;
    ctid = {id: data._id, extid: data.ctid};
    uidService = data.serviceProvider.uid.id;
    getOnlyId(idsService, data.serviceProvider.items);
    uidDevice = data.iotOwner.uid.id;
    getOnlyId(idsDevice, data.iotOwner.items);
    return userOp.update({_id: uidDevice}, { $pull: {hasContracts: ctid} });
  })
  .then(function(response){
      return itemOp.update({_id: {$in: idsDevice }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    return userOp.update({_id: uidService}, { $pull: {hasContracts: ctid} });
  })
  .then(function(response){
    return itemOp.update({_id: {$in: idsService }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    var notification = new notificationOp();
    notification.addressedTo.push(data.serviceProvider.cid.id, data.iotOwner.cid.id);
    // notification.sentBy = data.iotOwner.cid.id;
    // notification.userId = data.serviceProvider.uid.id;
    notification.ctId = data._id;
    notification.type = 23;
    notification.status = 'info';
    return notification.save();
  })
  .then(function(response){
    return audits.putAuditInt(
      data.iotOwner.cid.id,
      { orgOrigin: data.iotOwner.cid,
        orgDest: data.serviceProvider.cid,
        auxConnection: {kind: 'contract', item: data._id, extid: data.ctid},
        eventType: 52 }
    );
  })
  .then(function(response){
    return audits.putAuditInt(
      data.serviceProvider.cid.id,
      { orgOrigin: data.iotOwner.cid,
        orgDest: data.serviceProvider.cid,
        auxConnection: {kind: 'contract', item: data._id, extid: data.ctid},
        eventType: 52 }
    );
  })
  .then(function(response){
    callback(finalResp, false);
  })
  .catch(function(error){
    logger.debug(error);
    callback(error, true);
  });

}

// Private Functions

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id);
  }
}

// Export modules

module.exports.removeContract = removeContract;
module.exports.removing = removing;
