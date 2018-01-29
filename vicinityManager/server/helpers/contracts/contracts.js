// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../routes/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var notificationOp = require('../../models/vicinityManager').notification;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var sharingRules = require('../../helpers/sharingRules');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator

//Functions

/*
Accept a contract request
*/
function accepting(id, callback){
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
    notification.sentBy = updItem.serviceProvider.cid.id;
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
    callback(updItem, false);
  })
  .catch(function(error){
    logger.debug(error);
    callback(error, true);
  });
}

/*
Create a contract request
*/
function creating(data, callback){
  var ct_id;
  var ct = new contractOp();
  // ct.ctid = data.ctid === undefined ? uuid() : data.ctid;
  ct.ctid = uuid();
  ct.serviceProvider = { cid: data.cidService, uid: data.uidService, termsAndConditions: false, items: data.oidService };
  ct.iotOwner = { cid: data.cidDevice, uid: data.uidDevice, termsAndConditions: true, items: data.oidDevices };
  ct.readWrite = data.readWrite;
  ct.legalDescription = 'lorem ipsum';
  ct.type = 'serviceRequest';
  ct.save(
    function(error, response){
      if(error){
        res.json({error: true, message: error});
      } else {
        ct_id = response._id;
        var cidService = data.cidService.extid;
        var cidDevice = data.cidDevice.extid;
        var ctidService = {id: ct_id, extid: response.ctid, contractingParty: data.cidDevice.id, contractingUser: data.uidDevice.id, approved: true };
        var ctidDevice = {id: ct_id, extid: response.ctid, contractingParty: data.cidService.id, contractingUser: data.uidService.id, approved: true };
        var uidService = data.uidService.id;
        var idsService = [];
        getOnlyId(idsService, data.oidService);
        var uidDevice = data.uidDevice.id;
        var idsDevice = [];
        getOnlyId(idsDevice, data.oidDevices);
        userOp.update({_id: uidDevice}, { $push: {hasContracts: ctidDevice} })
        .then(function(response){
            return itemOp.update({_id: {$in: idsDevice }}, { $push: {hasContracts: ctidDevice} }, { multi: true });
        })
        .then(function(response){
          return userOp.update({_id: uidService}, { $push: {hasContracts: ctidService} });
        })
        .then(function(response){
          return itemOp.update({_id: {$in: idsService }}, { $push: {hasContracts: ctidService} }, { multi: true });
        })
        .then(function(response){
          var notification = new notificationOp();
          notification.addressedTo.push(data.cidService.id);
          notification.sentBy = data.cidDevice.id;
          notification.userId = data.uidService.id;
          notification.ctId = ct_id;
          notification.type = 21;
          notification.status = 'info';
          return notification.save();
        })
        .then(function(response){
          return audits.putAuditInt(
            data.cidDevice.id,
            { orgOrigin: data.cidDevice,
              orgDest: data.cidService,
              auxConnection: {kind: 'contract', item: ct_id, extid: ct.ctid},
              eventType: 53 }
          );
        })
        .then(function(response){
          return audits.putAuditInt(
            data.cidService.id,
            { orgOrigin: data.cidDevice,
              orgDest: data.cidService,
              auxConnection: {kind: 'contract', item: ct_id, extid: ct.ctid},
              eventType: 53 }
          );
        })
        .then(function(response){
          callback({}, false);
        })
        .catch(function(error){
          logger.debug(error);
          callback(error, true);
        });
      }
    }
  );
}

/*
Remove a contract
*/
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

function getOnlyOid(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i].extid);
  }
}

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id);
  }
}

// modules exports

module.exports.removing = removing;
module.exports.creating = creating;
module.exports.accepting = accepting;
