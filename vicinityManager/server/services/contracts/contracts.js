// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../controllers/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var notificationOp = require('../../models/vicinityManager').notification;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var sharingRules = require('../../services/sharingRules');
var commServer = require('../../services/commServer/request');
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
    notification.addressedTo.push(updItem.iotOwner.cid.id);
    notification.sentBy = updItem.serviceProvider.cid.id;
    notification.userId = [updItem.serviceProvider.uid.id, updItem.iotOwner.uid.id];
    notification.ctId = updItem._id;
    notification.itemId = updItem.serviceProvider.items[0].id;
    notification.type = 24;
    notification.status = 'info';
    return notification.save();
  })
  .then(function(response){
    var notification = new notificationOp();
    notification.addressedTo.push(updItem.serviceProvider.cid.id);
    notification.sentBy = updItem.serviceProvider.cid.id;
    notification.userId = [updItem.serviceProvider.uid.id, updItem.iotOwner.uid.id];
    notification.ctId = updItem._id;
    notification.itemId = updItem.serviceProvider.items[0].id;
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
  var idsService = [];
  var idsDevice = [];
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
        getOnlyId(idsService, data.oidService);
        var uidDevice = data.uidDevice.id;
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
          notification.userId = [data.uidService.id, data.uidDevice.id] ;
          notification.ctId = ct_id;
          notification.itemId = idsService[0];
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
    notification.addressedTo.push(data.serviceProvider.cid.id);
    // notification.sentBy = data.iotOwner.cid.id;
    notification.userId = [data.serviceProvider.uid.id, data.iotOwner.uid.id];
    notification.ctId = data._id;
    notification.itemId = data.serviceProvider.items[0].id;
    notification.type = 23;
    notification.status = 'info';
    return notification.save();
  })
  .then(function(response){
    var notification = new notificationOp();
    notification.addressedTo.push(data.iotOwner.cid.id);
    // notification.sentBy = data.iotOwner.cid.id;
    notification.userId = [data.serviceProvider.uid.id, data.iotOwner.uid.id];
    notification.ctId = data._id;
    notification.itemId = data.serviceProvider.items[0].id;
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
    logger.debug('Delete contract error: ' + error);
    callback(error, true);
  });
}

function removeDevice(item, otherParams, callback){
  var ctids = [];
  var mycid = item.cid.id._id;
  var friends = [];
  var notifs = [];
  if(item.accessLevel === 0){
    getOnlyId(ctids, item.hasContracts);
    // for(var j = 0; j < item.hasContracts.length; j++){
    //   notifs.push({mycid: mycid, othercid: item.hasContracts[j].contractingParty, thing: item.hasContracts[j].id, type: 22});
    // }
  } else {
    getOnlyId(friends, item.cid.id.knows);
    for(var i = 0; i < item.hasContracts.length; i++){
      if(friends.indexOf(item.hasContracts[i].contractingParty) === -1){
        ctids.push(item.hasContracts[i].id.toString());
        // notifs.push({mycid: mycid, othercid: item.hasContracts[i].contractingParty, thing: item.hasContracts[i].id, type: 22});
      }
    }
  }

  itemOp.update({_id: item._id}, {$pull: {hasContracts: {id: {$in: ctids}}}}, { multi: true })
  .then(function(){ return contractOp.update({_id: {$in: ctids}}, {$pull: {'iotOwner.items' : {id: item._id}}}, { multi: true }); })
  .then(function(){ return contractOp.update({_id: {$in: ctids}}, {$pull: {'serviceProvider.items' : {id: item._id}}}, { multi: true }); })
  .then(function(){
    for(var i = 0; i < item.hasContracts.length; i++){
      if(ctids.indexOf(item.hasContracts[i].id.toString()) !== -1){
        commServer.callCommServer({}, 'users/' + item.oid + '/groups/' + item.hasContracts[i].extid, 'DELETE');
      }
    }
    return true;
  })
  // .then(function(){
  //   for(item in notifs){
  //     createNotif(notifs[item].mycid, notifs[item].othercid, notifs[item].thing, notifs[item].type);
  //   }
  //   return true;
  // })
  .then(function(){
    contractValidity(ctids);
  })
  .then(function(){
    callback(item.oid, 'success');
  })
  .catch(function(err){
    callback(item.oid, err);
  });
}

// Private Functions

// function createNotif(mycid, othercid, thing, type){
//   var notification = new notificationOp();
//   notification.addressedTo.push(othercid, mycid);
//   notification.sentBy = mycid;
//   // notification.userId = "";
//   notification.ctId = thing;
//   notification.type = type;
//   notification.status = 'info';
//   return notification.save();
// }

function getOnlyOid(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    items.push(toAdd[i].extid);
  }
}

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    if(toAdd[i].hasOwnProperty("id")){
      array.push(toAdd[i].id.toString());
    } else {
      array.push(toAdd[i]._id.toString());
    }
  }
}

/*
If contract does not have items, delete it
*/
function contractValidity(ctids){
  contractOp.find({_id: {$in: ctids}}, {'serviceProvider.items':1, 'iotOwner.items':1})
  .then(function(response){
    for(var i = 0; i < ctids.length; i++){
      if(response[i].serviceProvider.items.length * response[i].iotOwner.items.length === 0){
        removing(ctids[i], function(resp,err){});
      }
    }
  })
  .catch(function(err){
    logger.debug('Error checking contract validity: ' + err);
  });
}

// modules exports

module.exports.removing = removing;
module.exports.removeDevice = removeDevice;
module.exports.creating = creating;
module.exports.accepting = accepting;
