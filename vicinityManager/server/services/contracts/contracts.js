// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../services/audit/audit');
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var notifHelper = require('../../services/notifications/notificationsHelper');
var commServer = require('../../services/commServer/request');
var sync = require('../../services/asyncHandler/sync');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator

//Functions

/**
Create a contract request
* @return {Callback}
*/
function creating(data, token_uid, token_mail, callback){
  var ct_id, ctid;
  var ct = new contractOp();
  var idsService = [];
  var idsDevice = [];
  var uidService = [];
  var uidDevice = [];

  ct.ctid = uuid();
  ct.foreignIot = { cid: data.cidService, uid: data.uidsService, termsAndConditions: false, items: data.oidsService };
  ct.iotOwner = { cid: data.cidDevice, uid: data.uidsDevice, termsAndConditions: true, items: data.oidsDevice };
  ct.readWrite = data.readWrite;
  ct.legalDescription = 'lorem ipsum';
  ct.type = 'serviceRequest';
  ct.save(
    function(error, response){
      if(error){
        res.json({error: true, message: error});
      } else {
        ct_id = response._id;
        ctid = response.ctid;
        ct_type = response.type;
        var allRequesterItems = response.iotOwner.items;
        var cidService = data.cidService.extid;
        var cidDevice = data.cidDevice.extid;
        var ctidService = {id: ct_id, extid: response.ctid, contractingParty: data.cidDevice.id, contractingUser: token_uid, approved: false, readWrite: response.readWrite };
        // If only one requester we asume that it is provinding all items itself, therefore the contract is approved by default
        var ctidDeviceItem = {id: ct_id, extid: response.ctid, contractingParty: data.cidService.id, contractingUser: data.contractingUser.id, approved: data.uidsDevice.length === 1, readWrite: response.readWrite };
        var ctidDeviceUser = {id: ct_id, extid: response.ctid, contractingParty: data.cidService.id, contractingUser: data.contractingUser.id, approved: true, readWrite: response.readWrite };

        getOnlyId(uidService, data.uidsService);
        getOnlyId(idsService, data.oidsService);
        getOnlyId(uidDevice, data.uidsDevice);
        getOnlyId(idsDevice, data.oidsDevice);
        userOp.update({_id: {$in: uidDevice }}, { $push: {hasContracts: ctidDeviceUser} }, { multi: true })
        .then(function(response){
          return itemOp.update({_id: {$in: idsDevice }}, { $push: {hasContracts: ctidDeviceItem} }, { multi: true });
        })
        .then(function(response){
          return userOp.update({_id: {$in: uidService }}, { $push: {hasContracts: ctidService} }, { multi: true });
        })
        .then(function(response){
          return itemOp.update({_id: {$in: idsService }}, { $push: {hasContracts: ctidService} }, { multi: true });
        })
        .then(function(response){
          return createContract(ctid, 'Contract: ' + ct_type);
        })
        .then(function(response){
          if(data.uidsDevice.length === 1){ // I know that contract req is the only device owner then I can add his devices to the contract group
            var items = [];
            getOnlyOid(items, allRequesterItems);
            return addItemsToContract(ctid, token_mail, items);
          } else {
            return false;
          }
        })
        .then(function(response){
          return notifHelper.createNotification(
            { kind: 'user', item: token_uid, extid: token_mail },
            { kind: 'user', item: data.contractingUser.id, extid: data.contractingUser.extid },
            { kind: 'contract', item: ct_id, extid: ctid },
            'info', 21, null);
        })
        .then(function(response){
          return audits.create(
            { kind: 'user', item: token_uid, extid: token_mail },
            { kind: 'user', item: data.contractingUser.id, extid: data.contractingUser.extid },
            { kind: 'contract', item: ct_id, extid: ctid },
            53, null);
        })
        .then(function(response){
          callback(false, 'Contract posted, waiting for approval');
        })
        .catch(function(error){
          logger.debug(error);
          callback(true, error);
        });
      }
    }
  );
}

/**
Accept a contract request
* @return {Callback}
*/
function accepting(id, token_uid, token_mail, callback){
  // TODO enable option to accept contract by iotOwner
  var updItem = {};
  var query = { $set: {"foreignIot.termsAndConditions": true, status: 'accepted'} };
  contractOp.findOneAndUpdate({"_id": id}, query, {new: true})
  .then(function(response){
    updItem = response.toObject(); // Get rid of virtuals and functions
    // Service Provider approves contract
    return userOp.updateOne({"_id": token_uid, "hasContracts.id" :updItem._id},
                            {$set: { "hasContracts.$.approved" : true }});
  })
  .then(function(response){
    var items = [];
    getOnlyOid(items, updItem.foreignIot.items);
    return addItemsToContract(updItem.ctid, token_mail, items);
  })
  // TODO send notifications and audits to all parties involved
  // .then(function(response){
  //   return notifHelper.createNotification(
  //     { kind: 'user', item: updItem.foreignIot.uid.id, extid: updItem.foreignIot.uid.extid },
  //     { kind: 'user', item: updItem.iotOwner.uid.id, extid: updItem.iotOwner.uid.extid },
  //     { kind: 'contract', item: updItem._id, extid: updItem.ctid },
  //     'info', 24, null);
  // })
  // .then(function(response){
  //   return audits.create(
  //     { kind: 'user', item: updItem.foreignIot.uid.id, extid: updItem.foreignIot.uid.extid },
  //     { kind: 'user', item: updItem.iotOwner.uid.id, extid: updItem.iotOwner.uid.extid },
  //     { kind: 'contract', item: updItem._id, extid: updItem.ctid },
  //     51, null);
  // })
  .then(function(response){
    callback(false, updItem);
  })
  .catch(function(error){
    logger.debug(error);
    callback(true, error);
  });
}


/**
Remove a contract
* @return {Callback}
*/
function removing(id, token_uid, token_mail, callback){
  var finalResp;
  var data = {};
  var idsDevice = [];
  var idsService = [];
  var uidService = [];
  var uidDevice = [];
  var cidService = "";
  var cidDevice = "";
  var ctid = {};
  var query = {
    foreignIot:{},
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
    return cancelContract(data.ctid);
  })
  .then(function(response){
    finalResp = response;
    cidService = data.foreignIot.cid.extid;
    cidDevice = data.iotOwner.cid.extid;
    ctid = {id: data._id, extid: data.ctid};
    getOnlyId(uidService, data.foreignIot.uid);
    getOnlyId(idsService, data.foreignIot.items);
    getOnlyId(uidDevice, data.iotOwner.uid);
    getOnlyId(idsDevice, data.iotOwner.items);
    return userOp.update({_id: {$in: uidDevice }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    return itemOp.update({_id: {$in: idsDevice }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    return userOp.update({_id: {$in: uidService }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    return itemOp.update({_id: {$in: idsService }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  // TODO notifiy all contract users
  // .then(function(response){
  //   return notifHelper.createNotification(
  //     { kind: 'user', item: data.serviceProvider.uid.id, extid: data.serviceProvider.uid.extid },
  //     { kind: 'user', item: data.iotOwner.uid.id, extid: data.iotOwner.uid.extid },
  //     { kind: 'contract', item: ctid.id, extid: ctid.extid },
  //     'info', 23, null);
  // })
  // .then(function(response){
  //   return notifHelper.createNotification(
  //     { kind: 'user', item: data.iotOwner.uid.id, extid: data.iotOwner.uid.extid },
  //     { kind: 'user', item: data.serviceProvider.uid.id, extid: data.serviceProvider.uid.extid },
  //     { kind: 'contract', item: ctid.id, extid: ctid.extid },
  //     'info', 23, null);
  // })
  // .then(function(response){
  //   return audits.create(
  //     { kind: 'user', item: data.iotOwner.uid.id, extid: data.iotOwner.uid.extid },
  //     { kind: 'user', item: data.serviceProvider.uid.id, extid: data.serviceProvider.uid.extid },
  //     { kind: 'contract', item: ctid.id, extid: ctid.extid },
  //     52, null);
  // })
  .then(function(response){
    callback(false, finalResp);
  })
  .catch(function(error){
    logger.debug('Delete contract error: ' + error);
    callback(true, error);
  });
}

/**
* Contract feeds
* @param {String} uid
*
* @return {Array} Contract requests
*/
function contractFeeds(uid, callback){
  userOp.findOne({_id: uid}, {hasContracts:1})
  .then(function(response){
    logger.debug(response);
    var openContracts = [];
    for(var i = 0; i < response.hasContracts.length; i++){
      if(!response.hasContracts[i].approved){
        openContracts.push(response.hasContracts[i]);
      }
    }
    callback(false, openContracts);
  })
  .catch(function(err){
    logger.debug(err);
    callback(true, err);
  });
}

/**
* Contract feeds
* @param {String} ctid
* @param {String} uid
*
* @return {Object} Contract instance
*/
function contractInfo(ctid, uid, callback){
  var query = checkInput(ctid);
  contractOp.findOne(query)
  .then(function(response){
    if(!response){
      callback(false, "The contract with: " + JSON.stringify(query) + " could not be found...");
    } else if(response.iotOwner.uid.id.toString() !== uid.toString() && response.serviceProvider.uid.id.toString() !== uid.toString()) {
      callback(false, "You are not part of the contract with ctid: " + response.ctid);
    } else {
      callback(false, response);
    }
  })
  .catch(function(err){
    logger.debug(err);
    callback(true, err);
  });
}


// Private Functions --------------------------------

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
Start contract group in commServer
*/
function createContract(id, descr){
  var payload = {
    name: id,
    description: descr
  };
  return commServer.callCommServer(payload, 'groups', 'POST');
}

/*
Add items to the contract
*/
function addItemsToContract(ctid, token_mail, items){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      // logger.debug('Start async handler...');
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          adding(value, otherParams, function(value, result) {
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === items.length){
            logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {ctid: ctid, mail: token_mail}
      );
    } else {
      logger.warn({user:mail, action: 'addItemToContract', message: "No items to be added"});
      resolve({"error": false, "message": "Nothing to be removed..."});
    }
  });
}

/*
Add items to contract group in commServer
*/
function adding(oid, otherParams, callback){
  // logger.debug('START execution with value =', oid);
  itemOp.updateOne({"oid": oid, "hasContracts.extid" :otherParams.ctid}, {$set: { "hasContracts.$.approved" : true }})
  .then(function(response){
    return commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.ctid , 'POST');
  })
  .then(function(response){
    logger.audit({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid });
    callback(oid, "Success");})
  .catch(function(err){
    logger.error({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid, message: err });
    callback(oid, 'Error: ' + err);
  });
}

/*
Remove contract group in commServer
*/
function cancelContract(id){
  return commServer.callCommServer({}, 'groups/' + id, 'DELETE')
  .catch(function(err){
    return new Promise(function(resolve, reject) {
      if(err.statusCode !== 404){
        reject('Error in commServer: ' + err);
      } else {
        resolve(true);
      }
    });
  });
}

/*

*/
function checkInput(ctid){
  try{
    var id = mongoose.Types.ObjectId(ctid);
    return {_id: id};
  }
  catch(err){
    return {ctid: ctid};
  }
}

// modules exports

module.exports.removing = removing;
module.exports.creating = creating;
module.exports.accepting = accepting;
module.exports.contractFeeds = contractFeeds;
module.exports.contractInfo = contractInfo;
