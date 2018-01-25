// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../routes/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator

/*
Create contracts
- On creation, a contract is by default status=pending
- Receives _ids of both companies, both users, and all items involved
- Receives also accessRights / Read/Write -- True/ Read Only -- False
- Currently it is only possible to request a service --> iotOwner termsAndConditions = TRUE
// TODO Create notification
// TODO Create audit
*/
function createContract(req, res){
  var data = req.body;
  var ct_id;
  var ct = new contractOp();
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
        var ctidService = {id: ct_id, extid: response.ctid, contractingParty: cidDevice, approved: true };
        var ctidDevice = {id: ct_id, extid: response.ctid, contractingParty: cidService, approved: true };
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
          res.json({error: false});
        })
        .catch(function(error){
          logger.debug(error);
          res.json({error: true});
        });
      }
    }
  );
}

// Private Functions

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id);
  }
}

// Export modules

module.exports.createContract = createContract;
