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
  // Case contracting user not provided, assume it is the first in the array of contracted service
  var contractingUser = data.contractingUser !== undefined ? data.uidsService[0] : data.contractingUser;

  ct.ctid = data.ctid === undefined ? uuid() : data.ctid;
  ct.foreignIot = { cid: data.cidService, uid: data.uidsService, termsAndConditions: false, items: data.oidsService };
  ct.iotOwner = { cid: data.cidDevice, uid: data.uidsDevice, termsAndConditions: true, items: data.oidsDevice };
  ct.readWrite = data.readWrite;
  ct.legalDescription = 'lorem ipsum';
  ct.type = 'serviceRequest';
  ct.save(
    function(error, response){
      if(error){
        logger.debug(error);
        callback(true, error);
      } else {
        ct_id = response._id;
        ctid = response.ctid;
        ct_type = response.type;

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
          logger.debug('Contract posted, waiting for approval');
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
  var query = {};
  userOp.findOneAndUpdate({"_id": token_uid, "hasContracts.id" :id},
                          {$set: { "hasContracts.$.approved" : true, "hasContracts.$.inactive": [] }}, {new:true})
  .then(function(response){
    for(var i = 0; i < response.hasContracts.length; i ++){
      if(response.hasContracts[i].id.toString() === id.toString()){
        imAdmin = response.hasContracts[i].imAdmin;
        imForeign = response.hasContracts[i].imForeign;
      }
    }
    if(imAdmin && imForeign){
      query = { $set: {"foreignIot.termsAndConditions": true} };
      return contractOp.findOneAndUpdate({"_id": id}, query, {new: true});
    } else if(imAdmin && !imForeign){
      query = { $set: {"iotOwner.termsAndConditions": true} };
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
    return createNotifAndAudit(updItem._id, updItem.ctid, token_uid, token_mail, updItem.iotOwner.uid, updItem.foreignIot.uid, imAdmin, 'ACCEPT'); // Accepted = true
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
    var openContracts = [];
    for(var i = 0; i < response.hasContracts.length; i++){
      if(!response.hasContracts[i].approved || response.hasContracts[i].inactive.length > 0){
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
    var data = response.toObject();
    if(!response){
      callback(false, "The contract with: " + JSON.stringify(query) + " could not be found...");
    } else if(!uidInContract(uid, data)) {
      callback(false, "You are not part of the contract with ctid: " + data.ctid);
    } else {
      callback(false, response);
    }
  })
  .catch(function(err){
    logger.debug(err);
    callback(true, err);
  });
}

/*
When an item is updated we need to put them in "hold" the contracts
1 - Remove from ct comm server groups
2 - Set in item in all contracts approved=false
3 - Add flag in user contract instance with the "inactive" items
4 - Create notifications and logs
*/
function pauseContracts(oid, cts, uid){
  logger.debug('Pausing contracts for: ' + oid.extid);
  return new Promise(function(resolve, reject) {
    if(cts.length > 0){ // Check if there is any item to delete
      sync.forEachAll(cts,
        function(value, allresult, next, otherParams) {
          // Add inactive items to user contract item
          userOp.update({"_id": uid.id, "hasContracts.extid": value.extid},
                        {$push: {"hasContracts.$.inactive": oid.extid } })
          .then(function (response) {
            deletingOne(otherParams.oid, {mail: otherParams.mail, ctid: value.extid}, function(value, result) {
                allresult.push({value: oid.extid, result: result});
                next();
            });
          })
          .catch(function (error) {
            allresult.push({value: value.extid, result: err});
            next();
          });
        },
        function(allresult) {
          if(allresult.length === cts.length){
            var ct_oids = [];
            getOnlyOid(ct_oids, cts);
            itemOp.findOne({"_id": oid.id})
            .then(function (response) {
              // Set to approved false all contracts in an inactive item
                for(var i = 0, l = response.hasContracts.length; i < l; i++){
                  if(ct_oids.indexOf(response.hasContracts[i].extid) !== -1){
                    response.hasContracts[i].approved = false;
                  }
                }
                return response.save();
            })
            .then(function (response) {
              // Only set to inactive infrastructure --> Service would reset whole contract
              return contractOp.update({"ctid": {$in: ct_oids}, "iotOwner.items.id": oid.id },
                              {$set: { "iotOwner.items.$.inactive" : true }},
                              {multi: true});
            })
            .then(function (response) {
              for(var i = 0, l = cts.length; i < l; i++){
                notifHelper.createNotification(
                  { kind: 'user', item: uid.id, extid: uid.extid },
                  { kind: 'item', item: oid.id, extid: oid.extid },
                  { kind: 'contract', item: cts[i].id, extid: cts[i].extid },
                  'info', 26, null
                );
              }
              return true;
            })
            .then(function(response){
              for(var i = 0, l = cts.length; i < l; i++){
                audits.create(
                  { kind: 'user', item: uid.id, extid: uid.extid },
                  {},
                  { kind: 'contract', item: cts[i].id, extid: cts[i].extid },
                  56, "Item " + oid.extid + " disabled");
                }
              return true;
            })
            .then(function (response) {
              resolve({toPause: allresult});
            })
            .catch(function (err) {
              logger.debug(err);
              reject(err);
            });
          }
        },
        false,
        {oid: oid.extid, mail: uid.extid}
      );
    } else {
      logger.warn({user:uid.extid, action: 'removeItemFromContract', message: "No items to be removed"});
      resolve({toPause: "Nothing to be removed..."});
    }
  });
}

/*
Reactivate ONE item in ONE contract after update
1 - Add to ct comm server groups
2 - Set ONE item in ONE contract approved=true
3 - Remove item from flags in user contract "inactive" items
4 - Create notifications and logs
*/
function enableOneItem(oid, ct, uid){
  return new Promise(function(resolve, reject) {
    var otherData = {ctid: ct.extid, mail: uid.extid};
    addingOne(oid, otherData, function(err, response){
      itemOp.update({"oid": oid, "hasContracts.extid" : ct.extid},
                     {$set: { "hasContracts.$.approved" : true }})
     .then(function(response){
       return userOp.update({"_id": uid.id, "hasContracts.extid" : ct.extid},
                      {$pull: { "hasContracts.$.inactive" : oid }});
     })
     .then(function(response){
       return audits.create(
         { kind: 'user', item: uid.id, extid: uid.extid },
         {},
         { kind: 'contract', item: ct.id, extid: ct.extid },
         56, "Item " + oid + " enabled");
     })
     .then(function (response) {
       resolve('Success');
     })
     .catch(function(err){
       reject(err);
     });
   });
  // TODO Notifs
  });
}

/*
Remove ONE item from contract
1 - Remove from ct comm server groups
2 - Pull contract object from item
3 - Pull item from user contract obj inactives (just in case)
4 - Pull item from contract
5 - Create notifications and logs (Deleting one function)
*/
function removeOneItem(oid, ct, uid){
  return new Promise(function(resolve, reject) {
    var otherData = {ctid: ct.extid, mail: uid.extid};
    deletingOne(oid, otherData, function(err, response){
      itemOp.update({"oid": oid}, {$pull: { hasContracts: {extid : ct.extid }}})
     .then(function(response){
       return userOp.update({"_id": uid.id, "hasContracts.extid" : ct.extid},
                      {$pull: { "hasContracts.$.inactive" : oid }});
     })
     .then(function(response){
       return contractOp.update({"ctid": ct.extid}, {$pull: { "foreignIot.items" : { extid: oid }}});
     })
     .then(function(response){
       return contractOp.update({"ctid": ct.extid}, {$pull: { "iotOwner.items" : { extid: oid }}});
     })
     .then(function(response){
       return audits.create(
         { kind: 'user', item: uid.id, extid: uid.extid },
         {},
         { kind: 'contract', item: ct.id, extid: ct.extid },
         56, "Item " + oid + " removed");
     })
     .then(function (response) {
       resolve('Success');
     })
     .catch(function(err){
       reject(err);
     });
   });
  // TODO Notifs
  });
}

/*
Restart contract, when a service gets updated
1 - Remove contract
2 - Create contract with same specs
3 - Create notifications and logs
*/
function resetContract(cts, uid){
  logger.debug('Reset contracts...');
  return new Promise(function(resolve, reject) {
    if(cts.length > 0){ // Check if there is any item to delete
      sync.forEachAll(cts,
        function(value, allresult, next, otherParams) {
          var contractData = {};
          var uidService = [];
          var idsService = [];
          var uidDevice = [];
          var idsDevice = [];
          var items = [];
          var users = [];
          contractOp.findOne({ctid: value.extid})
          .then(function(response){
            // Set item has contract inactive to true
            for(var i=0, l = response.iotOwner.items.length; i < l; i++){
              response.iotOwner.items[i].inactive = true;
            }
            for(var j=0, k = response.foreignIot.items.length; j < k; j++){
              response.foreignIot.items[j].inactive = true;
            }
            // Gather contract data
            try{
              contractData = response.toObject();
              getOnlyId(uidService, contractData.foreignIot.uid);
              getOnlyId(idsService, contractData.foreignIot.items);
              getOnlyId(uidDevice, contractData.iotOwner.uid);
              getOnlyId(idsDevice, contractData.iotOwner.items);
              users = uidService.concat(uidDevice);
              items = idsService.concat(idsDevice);
            } catch(err){
              logger.debug('error: ' + err);
              allresult.push({value: value.extid, result: err});
              next();
            }
            // Save contract with changes (items inactive = true)
            return response.save();
          })
          .then(function (response) {
            // Remove Contract group in comm server
            return cancelContract(value.extid);
          })
          .then(function (response) {
            // Add contract group in comm server
            return createContract(value.extid, 'Contract: ' + contractData.type);
          })
          .then(function (response) {
            return userOp.update({_id: {$in: users}, "hasContracts.extid" : contractData.ctid},
                                    {$set: { "hasContracts.$.approved" : false }},
                                    {multi:true});
          })
          .then(function (response) {
            return itemOp.update({_id: {$in: items}, "hasContracts.extid" : contractData.ctid},
                                    {$set: { "hasContracts.$.approved" : false }},
                                    {multi:true});
          })
          .then(function (response) {
            query = { $set: {"foreignIot.termsAndConditions": false, "iotOwner.termsAndConditions": false} };
            return contractOp.update({"_id": contractData._id}, query);
          })
          .then(function (response) {
            return createNotifAndAudit(contractData._id, contractData.ctid, uid.id, uid.extid, contractData.iotOwner.uid, contractData.foreignIot.uid, true, 'UPDATE'); // Accepted = true
          })
          .then(function (response) {
            allresult.push({value: value.extid, result: 'Success'});
            next();
          })
          .catch(function (err) {
            allresult.push({value: value.extid, result: err});
            next();
          });
        },
        function(allresult) {
          if(allresult.length === cts.length){
            resolve({toReset: allresult});
          }
        },
        false,
        {uid: uid}
      );
    } else {
      logger.warn({user:uid.extid, action: 'updateContract', message: "No contracts to be updated"});
      resolve({toReset: "Nothing to be removed..."});
    }
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
        legalDescription: "", status: "deleted"
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
        return createNotifAndAudit(data._id, data.ctid, token_uid, token_mail, data.iotOwner.uid, data.foreignIot.uid, true, "DELETE"); // Accepted = true
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
      return createNotifAndAudit(data._id, data.ctid, uid, mail, data.iotOwner.uid, data.foreignIot.uid, false, "DELETE"); // Accepted = true
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
Add or remove items to the contract
*/
function moveItemsInContract(ctid, token_mail, items, add){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          if(add){
            addingOne(value, otherParams, function(value, result) {
                allresult.push({value: value, result: result});
                next();
            });
          } else {
            deletingOne(value, otherParams, function(value, result) {
                allresult.push({value: value, result: result});
                next();
            });
          }
        },
        function(allresult) {
          if(allresult.length === items.length){
            // logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {ctid: ctid, mail: token_mail}
      );
    } else {
      if(add){
        logger.warn({user:token_mail, action: 'addItemToContract', message: "No items to be added"});
        resolve({"error": false, "message": "Nothing to be added..."});
      } else {
        logger.warn({user:token_mail, action: 'removeItemFromContract', message: "No items to be removed"});
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
    return contractOp.update({"iotOwner.items.extid": oid, ctid : otherParams.ctid}, {$set: { "iotOwner.items.$.inactive" : false }});
  })
  .then(function(response){
    return contractOp.update({"foreignIot.items.extid": oid, ctid : otherParams.ctid}, {$set: { "foreignIot.items.$.inactive" : false }});
  })
  .then(function(response){
    return commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.ctid , 'POST');
  })
  .then(function(response){
    logger.audit({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid });
    callback(oid, "Success");})
  .catch(function(err){
    if(err.statusCode !== 404){
      logger.error({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid, message: err });
      callback(oid, 'Error: ' + err);
    } else {
      logger.audit({user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid });
      callback(oid, "Success");
    }
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
    if(err.statusCode !== 404){
      logger.error({user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid, message: err });
      callback(oid, 'Error: ' + err);
    } else {
      logger.audit({user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid });
      callback(oid, "Success");
    }
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
Create notifications
*/
function createNotifAndAudit(ct_id, ctid, uid, mail, ownUsers, foreignUsers, imAdmin, type){
  return new Promise(function(resolve, reject) {
    var auditNumber;
    var notifNumber;
    var notifTarget = [];
    var message = null;
    var allUsers = ownUsers.concat(foreignUsers);
    try{
      for(var n = 0; n < allUsers.length; n++){
        notifTarget.push({kind: 'user', item: allUsers[n].id, extid: allUsers[n].extid});
      }

      if(imAdmin && type === "ACCEPT"){
        notifNumber = 22; auditNumber = 52;
      } else if(!imAdmin && type === "ACCEPT"){
        notifNumber = 24; auditNumber = 54;
      } else if(imAdmin && type === "DELETE"){
        notifNumber = 23; auditNumber = 53;
      } else if(!imAdmin && type === "DELETE"){
        notifNumber = 25; auditNumber = 55;
      } else if(type === "UPDATE"){
        notifNumber = 26; auditNumber = 56; message = "Reset contract";
      } else {
        resolve(false);
      }

      // Asynchronously notify all allUsers
      // Ignore response
      // TODO Do error handling for the response
      for(var i = 0; i < notifTarget.length; i++){
        notifHelper.createNotification(
          { kind: 'user', item: uid, extid: mail },
          notifTarget[i],
          { kind: 'contract', item: ct_id, extid: ctid },
          'info', notifNumber, message
        );
      }
      audits.create(
        { kind: 'user', item: uid, extid: mail },
        {},
        { kind: 'contract', item: ct_id, extid: ctid },
        auditNumber, message)
      .then(function(response){
        resolve(true);
      })
      .catch(function(err){
        reject(err);
      });
    } catch(err){
      logger.debug(err);
      resolve(true);
    }
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

/**
* Looks for the user id in the contracts
* @return {Boolean}
*/
function uidInContract(uid, data){
  var array = [];
  array = data.iotOwner.uid;
  array = array.concat(data.foreignIot.uid);
  for(var i = 0, l = array.length; i < l; i++){
    if(uid === array[i].id.toString()){
      return true;
    }
  }
  return false;
}


// modules exports ---------------------------

module.exports.removing = removing;
module.exports.creating = creating;
module.exports.accepting = accepting;
module.exports.contractFeeds = contractFeeds;
module.exports.contractInfo = contractInfo;
module.exports.removeAllContract = removeAllContract;
module.exports.pauseContracts = pauseContracts;
module.exports.enableOneItem = enableOneItem;
module.exports.resetContract = resetContract;
module.exports.removeOneItem = removeOneItem;
