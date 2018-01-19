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
- Receives also accessRights
- Currently it is only possible to request a service --> iotOwner termsAndConditions = TRUE
// TODO Create notification
// TODO Create audit
*/
function createContract(req, res){
  var data = req.body;
  var ct = new contractOp();
  ct.ctid = uuid();
  ct.serviceProvider = { cid: data.cidService, uid: data.uidService, termsAndConditions: false, items: data.oidService };
  ct.iotOwner = { cid: data.cidDevice, uid: data.uidDevice, termsAndConditions: true, items: data.oidDevices  };
  ct.accessRights = data.accessRights;
  ct.legalDescription = 'lorem ipsum';
  ct.type = 'serviceRequest';
  ct.save(
    function(error, response){
      if(error){
        res.json({error: true, message: error});
      } else {
        var cidService = data.cidService.extid;
        var cidDevice = data.cidDevice.extid;
        var ctidService = {id: response._id, extid: response.ctid, contractingParty: cidDevice };
        var ctidDevice = {id: response._id, extid: response.ctid, contractingParty: cidService };
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
          logger.debug(JSON.stringify(ct));
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
