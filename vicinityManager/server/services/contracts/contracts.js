// Global objects and variables
var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var audits = require('../../services/audit/audit');
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var notifHelper = require('../../services/notifications/notificationsHelper');
var commServer = require('../../services/commServer/request');
var ctChecks = require('./contractChecks.js');
var sync = require('../../services/asyncHandler/sync');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator

//Functions

/**
Create a contract request
* @return {Callback}
*/
function creating(req, res, callback){
  var data = req.body;
  var token_uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var token_mail = req.body.decoded_token.sub;

  var ct_id, ctid; // Contract id internal/external
  var ct = new contractOp();
  var idsService = []; // store internal ids services
  var idsDevice = []; // store internal ids devices
  var uidService = []; // store internal ids services owners
  var uidDevice = []; // store internal ids devices owners

  // Case contracting user not provided, assume it is the first in the array of contracted service
  var contractingUser = data.contractingUser === undefined ? data.uidsService[0] : data.contractingUser;

  //Building contract object
  ct.ctid = data.ctid === undefined ? uuid() : data.ctid;
  ct.foreignIot = { cid: data.cidService, uid: data.uidsService, termsAndConditions: false, items: data.oidsService };
  ct.iotOwner = { cid: data.cidDevice, uid: data.uidsDevice, termsAndConditions: true, items: data.oidsDevice };
  ct.readWrite = data.readWrite;
  ct.legalDescription = 'lorem ipsum';
  ct.type = 'serviceRequest';

  // Save contract object
  ct.save(
  function(error, response){
      if(error){
        callback(true, error);
      } else {
        try{
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

          // Get internal ids
          getOnlyProp(uidService, data.uidsService, ['id']);
          getOnlyProp(idsService, data.oidsService, ['id']);
          getOnlyProp(uidDevice, data.uidsDevice, ['id']);
          getOnlyProp(idsDevice, data.oidsDevice, ['id']);

          // Update items and users involved in the contract
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
            // Create contract group in comm server
            return createContract(ctid, 'Contract: ' + ct_type);
          })
          .then(function(response){
            // Get contract creator devices -- To add in contract because we assume that contract requester agrees terms
            return itemOp.find({"_id": { $in: idsDevice }, 'uid.id': token_uid}, {oid:1});
          })
          .then(function(response){
            var items = [];
            // Get OID of devices to be enabled in contract
            getOnlyProp(items, response, ['oid']);
            // Add items in contract group of comm server
            return moveItemsInContract(ctid, token_mail, items, true, req, res); // add = true
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
            logger.log(req, res, {type: 'audit', data: 'Contract posted, waiting for approval'});
            callback(false, 'Contract posted, waiting for approval');
          })
          .catch(function(error){
            callback(true, error);
          });
        } catch(err){
          callback(true, err);
        }
      }
    }
  );
}

/**
Accept a contract request
Input id (MONGO) or CTID, both supported
* @return {Callback}
*/
function accepting(req, res, callback){
  var id = req.params.id;
  var token_uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var token_mail = req.body.decoded_token.sub;

  // Build queries (accept id or ctid)
  var queryId = checkInput(id);
  var queryLong = checkInput2(id);
  queryLong._id = token_uid;

  var imAdmin = null;
  var imForeign = null;
  var updItem = {};
  var items = [];
  var query = {};
  userOp.findOneAndUpdate(queryLong,
                          {$set: { "hasContracts.$.approved" : true, "hasContracts.$.inactive": [] }}, {new:true})
  .then(function(response){
    for(var i = 0; i < response.hasContracts.length; i ++){
      if(response.hasContracts[i].id.toString() === id.toString() || response.hasContracts[i].extid === id){
        imAdmin = response.hasContracts[i].imAdmin;
        imForeign = response.hasContracts[i].imForeign;
      }
    }
    if(imAdmin && imForeign){
      query = { $set: {"foreignIot.termsAndConditions": true} };
      return contractOp.findOneAndUpdate(queryId, query, {new: true});
    } else if(imAdmin && !imForeign){
      query = { $set: {"iotOwner.termsAndConditions": true} };
      return contractOp.findOneAndUpdate(queryId, query, {new: true});
    } else {
      return contractOp.findOne(queryId);
    }
  })
  .then(function(response){
    updItem = response;
    if(imForeign){
      getOnlyProp(items, updItem.foreignIot.items.toObject(), ['id']);
    } else {
      getOnlyProp(items, updItem.iotOwner.items.toObject(), ['id']);
    }
    return itemOp.find({"_id": { $in: items }, 'uid.id': token_uid}, {oid:1});
  })
  .then(function(response){
    items = [];
    getOnlyProp(items, response, ['oid']);
    return moveItemsInContract(updItem.ctid, token_mail, items, true, req, res); // add = true
  })
  .then(function(response){
    return createNotifAndAudit(updItem._id, updItem.ctid, token_uid, token_mail, updItem.iotOwner.uid, updItem.foreignIot.uid, imAdmin, 'ACCEPT'); // Accepted = true
  })
  .then(function(response){
    logger.log(req, res, {type: 'audit', data: 'Contract accepted'});
    callback(false, updItem);
  })
  .catch(function(error){
    callback(true, error);
  });
}

/**
Remove a contract
* @return {Callback}
*/
function removing(req, res, callback){
  var id = req.params.id;
  var token_uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var token_mail = req.body.decoded_token.sub;

  // Build queries (accept id or ctid)
  var queryId = checkInput(id);
  var queryLong = checkInput2(id);
  queryLong._id = token_uid;

  var data = {}; var ctid = {};
  var imForeign; var imAdmin;

  userOp.findOne(queryLong, {hasContracts:1})
  .then(function(response){
    for(var i = 0; i < response.hasContracts.length; i ++){
      if(response.hasContracts[i].id.toString() === id.toString() || response.hasContracts[i].extid === id){
        imAdmin = response.hasContracts[i].imAdmin;
        imForeign = response.hasContracts[i].imForeign;
      }
    }
    if(imAdmin){
      removeAllContract(id, token_uid, token_mail);
    } else {
      removeOneUser(req, res, imForeign);
    }
  })
  .then(function(response){
    logger.log(req, res, {type: 'audit', data: 'Contract removed'});
    callback(false, response);
  })
  .catch(function(error){
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
    openContracts = openContracts.length > 0 ? openContracts : false;
    callback(false, openContracts);
  })
  .catch(function(err){
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
function contractInfo(req, res, callback){
  var ctid = req.params.ctid;
  var uid = req.body.decoded_token.uid;
  var query = checkInput(ctid);
  contractOp.findOne(query)
  .then(function(response){
    var data = response.toObject();
    if(!response){
      logger.log(req, res, {type: 'warn', data: "The contract with: " + JSON.stringify(query) + " could not be found"});
      callback(false, false);
    } else if(!uidInContract(uid, data)) {
      logger.log(req, res, {type: 'warn', data: "You are not part of the contract with ctid: " + data.ctid});
      res.status(401);
      callback(false, "You are not part of the contract with ctid: " + data.ctid);
    } else {
      callback(false, response);
    }
  })
  .catch(function(err){
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
function pauseContracts(req, res, ctData){
  var oid, ct, uid;
  if(ctData && ctData.ct.length > 0){
      oid = ctData.oid;
      ct = ctData.ct;
      uid = ctData.uid;
  } else {
      oid = req.body.oid;
      ct = req.body.ct;
      uid = req.body.uid;
  }
  var cts = [];
  if(ct.constructor === Array){
     cts = ct;
  }
  else { cts.push(ct); }
  return new Promise(function(resolve, reject) {
    if(cts.length > 0){ // Check if there is any item to delete
      sync.forEachAll(cts,
        function(value, allresult, next, otherParams) {
          // Add inactive items to user contract item
          userOp.update({"_id": uid.id, "hasContracts.extid": value.extid},
                        {$push: {"hasContracts.$.inactive": oid.extid } })
          .then(function (response) {
            deletingOne(otherParams.oid, {mail: otherParams.mail, ctid: value.extid}, req, res, function(value, result) {
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
            getOnlyProp(ct_oids, cts, ['extid']);
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
              var toNotif = [];
              for(var i = 0, l = cts.length; i < l; i++){
                toNotif.push(notifHelper.createNotification(
                 { kind: 'item', item: oid.id, extid: oid.extid },
                 { kind: 'user', item: uid.id, extid: uid.extid },
                 { kind: 'contract', item: cts[i].id, extid: cts[i].extid },
                 'info', 26, null));
              }
              return Promise.all(toNotif);
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
              logger.log(req, res, {type: 'debug', data: 'Disabling item in contract(s): ' + oid.extid});
              resolve({toPause: allresult});
            })
            .catch(function (err) {
              reject(err);
            });
          }
        },
        false,
        {oid: oid.extid, mail: uid.extid}
      );
    } else {
      logger.log(req, res, {type: 'warn', data: {user:uid.extid, action: 'removeItemFromContract', message: "No items to be removed"}});
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
function enableOneItem(req, res){
  var oid = req.body.oid;
  var ct = req.body.ct;
  var uid = req.body.uid;
  return new Promise(function(resolve, reject) {
    var otherData = {ctid: ct.extid, mail: uid.extid};
    addingOne(oid, otherData, req, res, function(err, response){
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
       logger.log(req, res, {type: 'debug', data: 'Enabling item from contract(s): ' + oid.extid});
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
function removeOneItem(req, res){
  var oid = req.body.oid;
  var ct = req.body.ct;
  var uid = req.body.uid;
  return new Promise(function(resolve, reject) {
    var otherData = {ctid: ct.extid, mail: uid.extid};
    deletingOne(oid, otherData, req, res, function(err, response){
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
       return ctChecks.contractValidity([ct.extid], uid.id, uid.extid);
     })
     .then(function(response){
       return audits.create(
         { kind: 'user', item: uid.id, extid: uid.extid },
         {},
         { kind: 'contract', item: ct.id, extid: ct.extid },
         56, "Item " + oid + " removed");
     })
     .then(function (response) {
       logger.log(req, res, {type: 'debug', data: 'Delete item from contract(s): ' + oid.extid});
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
              getOnlyProp(uidService, contractData.foreignIot.uid, ['id']);
              getOnlyProp(idsService, contractData.foreignIot.items, ['id']);
              getOnlyProp(uidDevice, contractData.iotOwner.uid, ['id']);
              getOnlyProp(idsDevice, contractData.iotOwner.items, ['id']);
              users = uidService.concat(uidDevice);
              items = idsService.concat(idsDevice);
            } catch(err){
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
      // logger.warn({user:uid.extid, action: 'updateContract', message: "No contracts to be updated"});
      resolve({toReset: "Nothing to be removed..."});
    }
  });
}

/*
Get user contracts
*/
function fetchContract(req, res){
  var id = mongoose.Types.ObjectId(req.params.id); // User id
  var offset = req.query.offset;
  var limit = req.query.limit;
  var filter = req.query.filter;
  var aggregation = [];
  aggregation.push({ $match: { "_id": id} });
  aggregation.push({ $unwind: "$hasContracts" });
  if(Number(filter) !== 0) {
    var filterOptions = [
      { $match: {"hasContracts.imForeign": true}},
      { $match:{ "hasContracts.imForeign": false}},
      // { $match:{ $or:[{"hasContracts.imAdmin": false}, {"hasContracts.imForeign": false}] }},
      { $match:{ $or:[{"hasContracts.approved": false}, {"hasContracts.inactive": {$gt: 0}}] }}
    ];
    aggregation.push(filterOptions[Number(filter) - 1]);
  }
  aggregation.push({ $sort: { "hasContracts.id": -1}});
  if(Number(offset) !== 0) aggregation.push({ $skip: Number(offset)});
  aggregation.push({ $limit: Number(limit) });
  aggregation.push({ $project: {"_id": 0, "hasContracts": 1}});
  return userOp.aggregate(aggregation)
  .then(function(response){
    return contractOp.populate(response, {path: "hasContracts.id"});
  })
 .then(function(contracts){
    if(contracts.length === 0){
      contracts = [];
      logger.log(req, res, {type: 'warn', data: 'No contracts for: ' + id});
      return Promise.resolve(contracts);
    } else {
      return Promise.resolve(contracts);
    }
  })
 .catch(function(error){
   return Promise.reject(error);
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
  var queryId = checkInput(id);

  return new Promise(function(resolve, reject) {
    contractOp.findOne(queryId)
    .then(function(response){
      var query = {
        foreignIot:{}, iotOwner:{},
        legalDescription: "", status: "deleted"
      };
      data = response.toObject(); // Get rid of metadata
      return contractOp.update(queryId, {$set: query});
    })
    .then(function(response){
      return cancelContract(data.ctid);
    })
    .then(function(response){
      ctid = {id: data._id, extid: data.ctid};
      getOnlyProp(users, data.foreignIot.uid, ['id']);
      getOnlyProp(items, data.foreignIot.items, ['id']);
      getOnlyProp(users, data.iotOwner.uid, ['id']);
      getOnlyProp(items, data.iotOwner.items, ['id']);
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
      resolve(response);
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
function removeOneUser(req, res, imForeign){
  var id = req.params.id;
  var queryId = checkInput(id);
  var uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var mail = req.body.decoded_token.sub;
  var items = []; var items_id = []; var items_oid = [];
  var query = {}; var ctid; var data = {};
  return new Promise(function(resolve, reject) {
    // Build pulling ct query based on if service owner or not
    if(imForeign){ query = { $pull: {"foreignIot.uid": {id: uid} } }; }
    else { query = { $pull: {"iotOwner.uid": {id: uid} } }; }
    // Start process
    contractOp.findOneAndUpdate(queryId, query, {new: true})
    .then(function(response){
      id = response._id; // Recover _id (Case original input was ctid)
      ctid = response.ctid;
      data = response;
      if(imForeign){ getOnlyProp(items, response.foreignIot.items.toObject(), ['id']); }
      else { getOnlyProp(items, response.iotOwner.items.toObject(), ['id']); }
      return itemOp.find({"_id": { $in: items }, 'uid.id': uid}, {oid:1});
    })
    .then(function(response){
      getOnlyProp(items_id, response, ['_id']);
      getOnlyProp(items_oid, response, ['oid']);
      if(imForeign){ query = { $pull: {"foreignIot.items": {id: {$in: items_id} } } }; }
      else { query = { $pull: {"iotOwner.items": {id: {$in: items_id} } } }; }
      return contractOp.update(queryId, query, {multi: true});
    })
    .then(function(response){
      return userOp.update({_id: uid}, { $pull: {hasContracts: {id: id} } });
    })
    .then(function(response){
      return itemOp.update({_id: {$in: items_id }}, { $pull: {hasContracts: {id: id} } }, { multi: true });
    })
    .then(function(response){
      return moveItemsInContract(ctid, mail, items_oid, false, req, res); // add = false
    })
    .then(function(response){
      return createNotifAndAudit(data._id, data.ctid, uid, mail, data.iotOwner.uid, data.foreignIot.uid, false, "DELETE"); // Accepted = true
    })
    .then(function(response){
      resolve(response);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

/*
Add or remove items to the contract
*/
function moveItemsInContract(ctid, token_mail, items, add, req, res){
  return new Promise(function(resolve, reject) {
    if(items.length > 0){ // Check if there is any item to delete
      sync.forEachAll(items,
        function(value, allresult, next, otherParams) {
          if(add){
            addingOne(value, otherParams, req, res, function(value, result) {
                allresult.push({value: value, result: result});
                next();
            });
          } else {
            deletingOne(value, otherParams, req, res, function(value, result) {
                allresult.push({value: value, result: result});
                next();
            });
          }
        },
        function(allresult) {
          if(allresult.length === items.length){
            resolve({"error": false, "message": allresult });
          }
        },
        false,
        {ctid: ctid, mail: token_mail}
      );
    } else {
      if(add){
        logger.log(req, res, {type: 'warn', data:{user:token_mail, action: 'addItemToContract', message: "No items to be added"}});
        resolve({"error": false, "message": "Nothing to be added..."});
      } else {
        logger.log(req, res, {type: 'warn', data:{user:token_mail, action: 'removeItemFromContract', message: "No items to be removed"}});
        resolve({"error": false, "message": "Nothing to be removed..."});
      }
    }
  });
}

/*
Add items to contract group in commServer
Extends to moveItemsInContract
*/
function addingOne(oid, otherParams, req, res, callback){
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
    logger.log(req, res, {type: "audit", data: {user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid }});
    callback(oid, "Success");})
  .catch(function(err){
    if(err.statusCode !== 404){
      callback(oid, 'Error: ' + err);
    } else {
      logger.log(req, res, {type: "audit", data: {user: otherParams.mail, action: 'addItemToContract', item: oid, contract: otherParams.ctid }});
      callback(oid, "Success");
    }
  });
}


/*
Remove items from contract group in commServer
Extends to moveItemsInContract
*/
function deletingOne(oid, otherParams, req, res, callback){
  commServer.callCommServer({}, 'users/' + oid + '/groups/' + otherParams.ctid , 'DELETE')
  .then(function(response){
    logger.log(req, res, {type: "audit", data: {user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid }});
    callback(oid, "Success");})
  .catch(function(err){
    if(err.statusCode !== 404){
      callback(oid, err);
    } else {
      logger.log(req, res, {type: "audit", data: {user: otherParams.mail, action: 'removeItemFromContract', item: oid, contract: otherParams.ctid }});
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
        reject(err);
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
    try{
      var allUsers = ownUsers.concat(foreignUsers);
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
      var toNotify = [];
      for(var i = 0; i < notifTarget.length; i++){
        toNotify.push(notifHelper.createNotification(
          { kind: 'user', item: uid, extid: mail },
          notifTarget[i],
          { kind: 'contract', item: ct_id, extid: ctid },
          'info', notifNumber, message
        ));
      }
      Promise.all(toNotify)
      .then(function(response){
        return audits.create(
        { kind: 'user', item: uid, extid: mail },
        {},
        { kind: 'contract', item: ct_id, extid: ctid },
        auditNumber, message);
      })
      .then(function(response){
        resolve(true);
      })
      .catch(function(err){
        reject(err);
      });
    } catch(err){
      resolve(true);
    }
  });
}


/*
Extract one field per object in array
Output: array of strings
*/
function getOnlyProp(items, toAdd, properties){
  var aux;
  for(var i = 0, l = toAdd.length; i < l; i++){
    aux = toAdd[i];
    for(var j = 0, k = properties.length; j < k; j++){
      aux = aux[properties[j]];
    }
    items.push(aux);
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

function checkInput2(ctid){
  var id;
  try{
    id = mongoose.Types.ObjectId(ctid);
    return {'hasContracts.id': id};
  } catch(err) {
    return {'hasContracts.extid': ctid};
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
module.exports.createNotifAndAudit = createNotifAndAudit;
module.exports.fetchContract = fetchContract;
