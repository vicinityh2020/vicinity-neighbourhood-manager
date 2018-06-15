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
  var contractingUser = {};

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
        // Case contracting user not provided, assume it is the first in the array of contracted service
        contractingUser = data.contractingUser !== 'undefined' ? Object.assign({},data.uidsService[0]) : Object.assign({},data.contractingUser);

        var cidService = data.cidService.extid;
        var cidDevice = data.cidDevice.extid;
        var ctidServiceItem = {id: ct_id, extid: response.ctid, contractingParty: data.cidDevice.id, contractingUser: token_uid, approved: false, readWrite: response.readWrite, imForeign: true };
        var ctidServiceUser = {id: ct_id, extid: response.ctid, contractingParty: data.cidDevice.id, contractingUser: token_uid, approved: false, readWrite: response.readWrite, imForeign: true };
        // If only one requester we asume that it is provinding all items itself, therefore the contract and its items are approved by default
        var ctidDeviceItem = {id: ct_id, extid: response.ctid, contractingParty: data.cidService.id, contractingUser: contractingUser.id, approved: data.uidsDevice.length === 1, readWrite: response.readWrite };
        var ctidDeviceUser = {id: ct_id, extid: response.ctid, contractingParty: data.cidService.id, contractingUser: contractingUser.id, approved: false, readWrite: response.readWrite };

        getOnlyId(uidService, data.uidsService);
        getOnlyId(idsService, data.oidsService);
        getOnlyId(uidDevice, data.uidsDevice);
        getOnlyId(idsDevice, data.oidsDevice);
        userOp.update({_id: {$in: uidDevice }}, { $push: {hasContracts: ctidDeviceUser} }, { multi: true })
        .then(function(response){ // Update main requester
          return userOp.update({_id: token_uid, "hasContracts.id" :ct_id},
                                  {$set: { "hasContracts.$.imAdmin" : true, "hasContracts.$.approved" : true }});
        })
        .then(function(response){
          return itemOp.update({_id: {$in: idsDevice }}, { $push: {hasContracts: ctidDeviceItem} }, { multi: true });
        })
        .then(function(response){
          return userOp.update({_id: {$in: uidService }}, { $push: {hasContracts: ctidServiceUser} }, { multi: true });
        })
        .then(function(response){ // Update main provider
          return userOp.update({_id: contractingUser.id, "hasContracts.id" :ct_id},
                                  {$set: { "hasContracts.$.imAdmin" : true }});
        })
        .then(function(response){
          return itemOp.update({_id: {$in: idsService }}, { $push: {hasContracts: ctidServiceItem} }, { multi: true });
        })
        .then(function(response){
          return createContract(ctid, 'Contract: ' + ct_type);
        })
        .then(function(response){ // Get contract creator devices -- To add in contract
          return itemOp.find({"_id": { $in: idsDevice }, 'uid.id': token_uid}, {oid:1});
        })
        .then(function(response){
          var items = [];
          getOnlyOid(items, response);
          return moveItemsInContract(ctid, token_mail, items, true); // add = true
        })
        .then(function(response){
          return notifHelper.createNotification(
            { kind: 'user', item: token_uid, extid: token_mail },
            { kind: 'user', item: contractingUser.id, extid: contractingUser.extid },
            { kind: 'contract', item: ct_id, extid: ctid },
            'info', 21, null);
        })
        .then(function(response){
          return audits.create(
            { kind: 'user', item: token_uid, extid: token_mail },
            { kind: 'user', item: contractingUser.id, extid: contractingUser.extid },
            { kind: 'contract', item: ct_id, extid: ctid },
            51, null);
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
  var imAdmin = null;
  var imForeign = null;
  var updItem = {};
  var items = [];
  userOp.findOneAndUpdate({"_id": token_uid, "hasContracts.id" :id},
                          {$set: { "hasContracts.$.approved" : true }}, {new:true})
  .then(function(response){
    for(var i = 0; i < response.hasContracts.length; i ++){
      if(response.hasContracts[i].id.toString() === id.toString()){
        imAdmin = response.hasContracts[i].imAdmin;
        imForeign = response.hasContracts[i].imForeign;
      }
    }
    if(imAdmin && imForeign){
      var query = { $set: {"foreignIot.termsAndConditions": true, status: 'accepted'} };
      return contractOp.findOneAndUpdate({"_id": id}, query, {new: true});
    } else {
      return contractOp.findOne({"_id": id});
    }
  })
  .then(function(response){
    updItem = response;
    if(imForeign){
      getOnlyId(items, updItem.foreignIot.items.toObject());
    } else {
      getOnlyId(items, updItem.iotOwner.items.toObject());
    }
    return itemOp.find({"_id": { $in: items }, 'uid.id': token_uid}, {oid:1});
  })
  .then(function(response){
    items = [];
    getOnlyOid(items, response);
    return moveItemsInContract(updItem.ctid, token_mail, items, true); // add = true
  })
  .then(function(response){
    return createNotifAndAudit(updItem._id, updItem.ctid, token_uid, token_mail, updItem.iotOwner.uid, updItem.foreignIot.uid, imAdmin, true); // Accepted = true
  })
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
  var data = {}; var ctid = {};
  var imForeign; var imAdmin;

  userOp.findOne({"_id": token_uid, "hasContracts.id" :id}, {hasContracts:1})
  .then(function(response){
    for(var i = 0; i < response.hasContracts.length; i ++){
      if(response.hasContracts[i].id.toString() === id.toString()){
        imAdmin = response.hasContracts[i].imAdmin;
        imForeign = response.hasContracts[i].imForeign;
      }
    }
    if(imAdmin){
      removeAllContract(id, token_uid, token_mail);
    } else {
      removeOneUser(id, token_uid, token_mail, imForeign);
    }
  })
  .then(function(response){
    callback(false, response);
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
* Contract info - return one contract
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

// Private Functions -------------------------------------------------

/**
Remove whole contract
* @return {Promise}
*/
function removeAllContract(id, token_uid, token_mail){
  var users = []; var items = [];
  var data = {}; var ctid = {};
  return new Promise(function(resolve, reject) {
    contractOp.findOne({_id:id})
    .then(function(response){
      var query = {
        foreignIot:{}, iotOwner:{},
        legalDescription: "", status: 'deleted'
        };
      data = response.toObject(); // Get rid of metadata
      return contractOp.update({_id:id}, {$set: query});
    })
    .then(function(response){
      return cancelContract(data.ctid);
    })
    .then(function(response){
      ctid = {id: data._id, extid: data.ctid};
      getOnlyId(users, data.foreignIot.uid);
      getOnlyId(items, data.foreignIot.items);
      getOnlyId(users, data.iotOwner.uid);
      getOnlyId(items, data.iotOwner.items);
      return userOp.update({_id: {$in: users }}, { $pull: {hasContracts: ctid} }, { multi: true });
    })
    .then(function(response){
      return itemOp.update({_id: {$in: items }}, { $pull: {hasContracts: ctid} }, { multi: true });
    })
    .then(function(response){
      if(token_uid && token_mail){
        return createNotifAndAudit(data._id, data.ctid, token_uid, token_mail, data.iotOwner.uid, data.foreignIot.uid, true, false); // Accepted = true
      }
    })
    .then(function(response){
      resolve(data);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

/**
Remove a user in a contract
* @return {Promise}
*/
function removeOneUser(id, uid, mail, imForeign){
  var items = []; var items_id = []; var items_oid = [];
  var query = {}; var ctid; var data = {};
  return new Promise(function(resolve, reject) {
    if(imForeign){ query = { $pull: {"foreignIot.uid": {id: uid} } }; }
    else { query = { $pull: {"iotOwner.uid": {id: uid} } }; }
    contractOp.findOneAndUpdate({"_id": id}, query, {new: true})
    .then(function(response){
      ctid = response.ctid;
      data = response;
      if(imForeign){ getOnlyId(items, response.foreignIot.items.toObject()); }
      else { getOnlyId(items, response.iotOwner.items.toObject()); }
      return itemOp.find({"_id": { $in: items }, 'uid.id': uid}, {oid:1});
    })
    .then(function(response){
      getOnlyId(items_id, response);
      getOnlyOid(items_oid, response);
      if(imForeign){ query = { $pull: {"foreignIot.items": {id: {$in: items_id} } } }; }
      else { query = { $pull: {"iotOwner.items": {id: {$in: items_id} } } }; }
      return contractOp.update({"_id": id}, query, {multi: true});
    })
    .then(function(response){
      return userOp.update({_id: uid}, { $pull: {hasContracts: {id: id} } });
    })
    .then(function(response){
      return itemOp.update({_id: {$in: items_id }}, { $pull: {hasContracts: {id: id} } }, { multi: true });
    })
    .then(function(response){
      return moveItemsInContract(ctid, mail, items_oid, false); // add = false
    })
    .then(function(response){
      return createNotifAndAudit(data._id, data.ctid, uid, mail, data.iotOwner.uid, data.foreignIot.uid, false, false); // Accepted = true
    })
    .then(function(response){
      resolve(data);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

/*
Add items to the contract
*/
function moveItemsInContract(ctid, token_mail, items, add){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      // logger.debug('Start async handler...');
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          if(add){
            addingOne(value, otherParams, function(value, result) {
                // logger.debug('END execution with value =', value, 'and result =', result);
                allresult.push({value: value, result: result});
                next();
            });
          } else {
            deletingOne(value, otherParams, function(value, result) {
                // logger.debug('END execution with value =', value, 'and result =', result);
                allresult.push({value: value, result: result});
                next();
            });
          }
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
      if(add){
        logger.warn({user:mail, action: 'addItemToContract', message: "No items to be added"});
        resolve({"error": false, "message": "Nothing to be added..."});
      } else {
        logger.warn({user:mail, action: 'removeItemFromContract', message: "No items to be removed"});
        resolve({"error": false, "message": "Nothing to be removed..."});
      }
    }
  });
}

/*
Add items to contract group in commServer
Extends to moveItemsInContract
*/
function addingOne(oid, otherParams, callback){
  itemOp.updateOne({"oid": oid, "hasContracts.extid" : otherParams.ctid}, {$set: { "hasContracts.$.approved" : true }})
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
Remove items from contract group in commServer
Extends to moveItemsInContract
*/
function deletingOne(oid, otherParams, callback){
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.ctid , 'DELETE')
  .then(function(response){
    logger.audit({user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid });
    callback(oid, "Success");})
  .catch(function(err){
    logger.error({user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid, message: err });
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
Creates array with oids
*/
function getOnlyOid(items, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    if(toAdd[i].hasOwnProperty("extid")){
      items.push(toAdd[i].extid);
    } else {
      items.push(toAdd[i].oid);
    }
  }
}

/*
Create notifications
*/
function createNotifAndAudit(ct_id, ctid, uid, mail, ownUsers, foreignUsers, imAdmin, accepted){
  return new Promise(function(resolve, reject) {
    var auditNumber;
    var notifNumber;
    var notifTarget = [];
    var allUsers = ownUsers.concat(foreignUsers);

    for(var n = 0; n < allUsers.length; n++){
      notifTarget.push({kind: 'user', item: allUsers[n].id, extid: allUsers[n].extid});
    }

    if(imAdmin && accepted){
      notifNumber = 22; auditNumber = 52;
    } else if(!imAdmin && accepted){
      notifNumber = 24; auditNumber = 54;
    } else if(imAdmin && !accepted){
      notifNumber = 23; auditNumber = 53;
    } else {
      notifNumber = 25; auditNumber = 55;
    }

    // Asynchronously notify all allUsers
    // Ignore response
    // TODO Do error handling for the response
    for(var i = 0; i < notifTarget.length; i++){
      notifHelper.createNotification(
        { kind: 'user', item: uid, extid: mail },
        notifTarget[i],
        { kind: 'contract', item: ct_id, extid: ctid },
        'info', notifNumber, null
      );
    }
    audits.create(
      { kind: 'user', item: uid, extid: mail },
      {},
      { kind: 'contract', item: ct_id, extid: ctid },
      auditNumber, null)
    .then(function(response){
      resolve(true);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

/*
Creates array with ids
*/
function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    if(toAdd[i].hasOwnProperty("id")){
      array.push(toAdd[i].id);
    } else {
      array.push(toAdd[i]._id);
    }
  }
}

/*
Accepts or mongo id or external id
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

// modules exports ---------------------------

module.exports.removing = removing;
module.exports.creating = creating;
module.exports.accepting = accepting;
module.exports.contractFeeds = contractFeeds;
module.exports.contractInfo = contractInfo;
module.exports.removeAllContract = removeAllContract;
