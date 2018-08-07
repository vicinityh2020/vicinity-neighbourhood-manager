// Global variables and objects
var fs = require("fs");
var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var nodeOp = require('../../models/vicinityManager').node;
var semanticRepo = require('../../services/semanticRepo/request');
var map = require('../../configuration/map');
var audits = require('../../services/audit/audit');
var sync = require('../../services/asyncHandler/sync');
var commServer = require('../../services/commServer/request');
var notifHelper = require('../../services/notifications/notificationsHelper');
var config = require('../../configuration/configuration');
var crypto = require('crypto');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var logger = require('../../middlewares/logger');

// Functions to support registration and agent calls

/*
Inserts all oids in the request
*/
function saveDocuments(objects, otherParams, callback){
  var obj = {};
  var pwd = crypto.randomBytes(32).toString('base64'); // password for comm server credentials
  var infra_id = objects["infrastructure-id"];
  delete objects["infrastructure-id"]; // remove infrastructure-id, no need to pass it further
  if(!otherParams.semanticValidation && objects.hasOwnProperty("adapter-id")){delete objects["adapter-id"];} // Unnecessary if no semantic validation

  // Create one item document
  obj.typeOfItem = findType(objects.type, otherParams.types); // Use collection of semanticTypes to find if service/device/unknown
  // Adding important fields for Vicinity
  obj.adid = {'id': otherParams.nodeId,
              'extid': otherParams.adid,
              'type': otherParams.adapterType,
              'name': otherParams.nodeName};
  obj.name = objects.name; // Name in commServer
  obj.cid = otherParams.cid; // CID, obtained from mongo
  obj.accessLevel = 0; // private by default
  obj.avatar = config.avatarItem; // Default avatar provided by VCNT
  obj.infrastructureId = infra_id; // Need to map with agent
  obj.status = 'disabled';
  if(!objects.credentials && !objects.oid){ // Create a new instance in Mongo
    // oidExist(uuid()) // Username in commServer & semanticRepo
    // .then(function(response){
      obj.oid = uuid(); // response
      if(otherParams.semanticValidation){
        objects.oid = obj.oid; // response
        semanticValidation(objects, obj, pwd, infra_id, callback);
      } else {
        obj.info = objects;
        obj.info.oid = obj.oid;
        createInstance(obj, pwd, infra_id, callback);
      }
    // }) // Register TD in semantic repository
    // .catch(function(err){callback({"infrastructure-id": infra_id, error: err}, err); });
  } else { // if the TD contains an OID, then we need to update the instance in Mongo (not create a new one)
    callback(
      { "infrastructure-id": infra_id,
        "error": "Your TD contained an OID, please consider update service instead"},
      "Update service disabled, you cannot register TDs with OID"
    );
  }
}

/*
Updates all oids in the request
*/
function updateDocuments(thing, otherParams, callback){
  var updThing = {};
  var oldThing = {};
  // If there is not oid, it is not possible to update
  if(thing.oid === undefined) callback(thing["infrastructure-id"], "Missing oid");

  // Remove unused properties
  delete thing["infrastructure-id"]; // remove infrastructure-id, no need to pass it further
  if(!otherParams.semanticValidation && thing.hasOwnProperty("adapter-id")){delete thing["adapter-id"];} // Unnecessary if no semantic validation

  // Find item type
  var newItemType = findType(thing.type, otherParams.types);

  itemOp.findOne({oid: thing.oid})
  .then(function(response){
    if(!response){
      callback(thing.oid, "Item not found");
    } else {
      oldThing = response;
      // The main type of the item has to remain equal (service or device)
      if(oldThing.typeOfItem !== newItemType) callback(thing.oid, "It is not possible to convert devices into services, or services into devices");
      return resetItemInCommServer(thing.oid, oldThing.cid.extid);
    }
  })
  .then(function(response){
    if(otherParams.semanticValidation){
      return semanticUpdate(thing);
    } else {
      return false;
    }
  })
  .then(function(response){
    if(!response){
      oldThing.info = thing; // TD was NOT validated
    } else {
      oldThing.info = response; // TD was validated
    }
    // Check if name has changed, if it has update other entities accordingly
    if(thing.name !== oldThing.name){
      oldThing.info = thing.name;
      return updateFriendlyName(thing.oid, oldThing.uid.id, oldThing.adid.id, thing.name);
    } else {
      return false;
    }
  })
  .then(function (response) {
    updThing = addInteractions(oldThing);
    // TODO update contracts and testing
    return updThing.save();
  })
  .then(function (response) {
    callback(td.oid, 'success');
  })
  .catch(function(err){
    callback(td.oid, err);
  });
}

/*
Totally new TD --> Expects new instance to be created
*/
function createInstance(objData, pwd, infra_id, callback){
  var objWithInteractions = addInteractions(objData);
  var obj = new itemOp(objWithInteractions);
  obj.save()
  .then(function(response){
    return commServerProcess(obj.oid, obj.name, pwd);
  })
  .then(function(response){
    callback({oid: obj.oid, password: pwd, "infrastructure-id": infra_id, "nm-id": obj._id, error: false}, "Success");
  })
  .catch(function(err){
    callback({"infrastructure-id": infra_id, error: err}, err);
  });
}

/*
Adds all new oids to the node hasItems
If the oid is already in there skip it
*/
function updateItemsList(items, allresult){
  // get oids only if doc saved succesfully
  return new Promise(function(resolve, reject) {
    try{
      // var oidArray = getIds(allresult, 'oid');
      var i, j;
      if(items.length > 0){
        var itemsOid = []; //store a simple array of OIDs to compare
        for(i = 0; i < items.length; i++){
            itemsOid.push(items[i].oid);
        }
        for(j = 0; j < allresult.length; j++){
          if(itemsOid.indexOf(allresult[j].data.oid) === -1 && allresult[j].result === "Success"){
            items.push({id: allresult[j].data["nm-id"], extid: allresult[j].data.oid});
          }
        }
      } else {
        for(j = 0; j < allresult.length; j++){
          if(allresult[j].result === "Success"){
            items.push({id: allresult[j].data["nm-id"], extid: allresult[j].data.oid});
          }
        }
      }
      resolve(items);
    } catch(err){
      reject("(collecting new oids for the node) " + err);
    }
  });
}

/*
Get service and device types from semantic repo or static file
*/
function getTypes(fromSemantiRepo){
  return new Promise(function(resolve, reject) {
    var data = {};
    // Gets annotations directly from semantic repository
    if(fromSemantiRepo){
      semanticRepo.getTypes()
      .then(function(response){
        data = parseGetTypes(JSON.parse(response).data);
        resolve(data);
      })
      .catch(function(err){
        reject(err);
      });
    } else {
      fs.readFile("/etc/getAnnotations/annotations.json", 'utf8', function(err, file){
        if(err || !file){
          // Case of error: Get data from backUp annotations (Might be old dated)
          data.services = map.map.data.service;
          data.devices = map.map.data.device;
          resolve(data);
        } else {
          // Get annotations from annotations service (Updates every day)
          var parsedFile = JSON.parse(file);
          data.services = parsedFile.data.service;
          data.devices = parsedFile.data.device;
          resolve(data);
        }
      });
    }
  });
}

/*
Semantic validation: Create new instance
Add and create instance in Mongo
*/
function semanticValidation(objects, obj, pwd, infra_id, callback){
  semanticRepo.callSemanticRepo(objects, "td/create", "POST")
  .then(function(response){
    var repoAnswer = JSON.parse(response);
    if(!(repoAnswer.data.hasOwnProperty('errors'))) {
      obj.info = JSON.parse(response).data.lifting; // Thing description obj, stores response from semanticRepo
      createInstance(obj, pwd, infra_id, callback);
    } else { // If lifting ends with error ...
      callback({"infrastructure-id": infra_id, error: repoAnswer.data.errors}, repoAnswer.data.errors);
    }
  })
  .catch(function(err){callback({"infrastructure-id": infra_id, error: err}, err); });
}

/*
Semantic validation: Update instance
First remove then add
*/
function semanticUpdate(thing){
  var info = {};
  return new Promise(function(resolve, reject) {
    semanticRepo.callSemanticRepo({}, "td/remove/" + thing.oid, 'DELETE')
    .then(function(response){
      if(response.removed === true) reject("Item not removed from semantic repository");
      return semanticRepo.callSemanticRepo(thing, "td/create", "POST");
    })
    .then(function(response){
      var repoAnswer = JSON.parse(response);
      if(!(repoAnswer.data.hasOwnProperty('errors'))) {
        info = JSON.parse(response).data.lifting; // Thing description obj, stores response from semanticRepo
        resolve(info);
      } else { // If lifting ends with error ...
        reject(repoAnswer.data.errors);
      }
    })
    .catch( function(err){ reject(err); } );
  });
}

/*
If the name of the item is updated, we need to updated the related collections
Update agent.hasItems and user.hasItems
*/
function updateFriendlyName(oid, uid, adid, name){
  return new Promise(function(resolve, reject) {
    userOp.update({"_id": uid, "hasItems.extid": oid}, {$set:{ "hasItems.$.name" : name }})
    .then(function(response){
      return nodeOp.update({"_id": adid, "hasItems.extid": oid}, {$set:{ "hasItems.$.name" : name }});
    })
    .then(function(response){
      resolve(true);
    })
    .catch(function(err){
      reject(err);
    });
  });
}

/*
Add interactions to item instance
properties, actions, events
*/
function addInteractions(objData){
  objData.interactionPatterns = [];
  try{
    var interactions = ["properties", "actions", "events"];
    var interactionsEffect = ["monitors", "affects", "monitors"];
    for(var i = 0; i < interactions.length; i++){
      if(objData.info.hasOwnProperty(interactions[i])){
        for(var j = 0; j < objData.info[interactions[i]].length; j++){
          objData.interactionPatterns.push({
            type: interactions[i],
            value: objData.info[interactions[i]][j][interactionsEffect[i]]
          });
        }
      }
    }
    return objData;
  }catch(err){
    // logger.debug('error: ' + err);
    return objData;
  }
}

/*
Extract valuable info from the types request static service
*/
function parseGetTypes(arr){
  return new Promise(function(resolve, reject) {
    try{
      var myTypes = {};
      myTypes.services = arr.service;
      myTypes.devices = arr.device;
      resolve(myTypes);
    }
    catch(err)
    {
      reject("(Error parsing types) " + err);
    }
  });
}

/*
Find main item type (device/service) based on the semantic repository types
*/
function findType(objType, types){
  if(types.devices.indexOf(objType) !== -1){
    return("device");
  } else if(types.services.indexOf(objType) !== -1){
    return("service");
  } else {
    return("unknown");
  }
}

/*
Sends a notification to the organisation after successful discovery
*/
function deviceActivityNotif(cid, type){
  return notifHelper.createNotification(
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    'info', type, null);
}

/*
Creates audit logs for each registered item
*/
function createAuditLogs(cid, ids, adid, type){
  return new Promise(function(resolve, reject) {
    try{
      // var oidArray = getIds(allresult, 'id');
      sync.forEachAll(ids,
        function(value, allresult, next, otherParams) { // Process all new items
            creatingAudit(value, otherParams, function(value, result) {
                allresult.push({value: value, result: result});
                next();
            });
        },
        function(allresult){
          // Final part: Return results, update node and notify
          if(allresult.length === ids.length){ // Only process final step if all the stack of tasks completed
            resolve('Audits created...');
          }
        },
        false,
        {cid: cid, user: "Agent:" + adid, type: type}
      );
    } catch(err){
      reject("Error creating audits: " + err);
    }
  });
}

function creatingAudit(ids, data, callback){
  if(ids.result === 'Success'){
    audits.create(
      { kind: 'userAccount', item: data.cid.id, extid: data.cid.extid },
      { kind: 'item', item: ids.data["nm-id"], extid: ids.data.oid },
      { extid: data.adid },
      data.type, null)
    .then(function(response){ callback(ids.data.oid,'Success');})
    .catch(function(err){ callback(ids.data.oid, err); });
  }else{
    callback(ids.data.oid, 'Oid not registered');
  }
}

/*
Creates user in commServer
Adds user to communication server
If the oid exists in the commServer is deleted and created anew
*/
function commServerProcess(docOid, docName, docPassword){
  var payload = {
    username : docOid,
    name: docName,
    password: docPassword,
    };
    return commServer.callCommServer({}, 'users/' +  docOid, 'GET')
      .then(
        function(response){
          return commServer.callCommServer(payload, 'users/' +  docOid, 'DELETE') // DELETE + POST instead of PUT because the OID might have changed the agent
          .then(function(response){ return commServer.callCommServer(payload, 'users', 'POST');})
          .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
        },
        function(err){
          if(err.statusCode !== 404){
            return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); // return rejected promise because we got a non controlled error
          } else {
            return commServer.callCommServer(payload, 'users', 'POST')
            .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
          }
        }
      );
    }

  /*
  Removes user from all groups
  Adds user to organisation group
  */
  function resetItemInCommServer(oid, cid){
    return new Promise(function(resolve, reject) {
      commServer.callCommServer({}, 'users/' +  oid + '/groups', 'DELETE')
      .then(function(response){
        return commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'POST');
      })
      .then(function (response) {
        logger.debug(response);
        resolve(true);
      })
      .catch(function(err){
        reject('Error in commServer: ' + err);
      });
    });
  }

    /*
    Checks if the oid is in Mongo
    If it is, creates a new one and checks again
    Ensures oid uniqueness
    */
    // function oidExist(oid){
    //   return itemOp.findOne({oid: oid})
    //   .then(
    //     function(data){
    //       if(!data){
    //         return new Promise(function(resolve, reject) { resolve(oid) ;} );
    //       } else {
    //         oid = uuid();
    //         oidExist(oid);
    //       }
    //     })
    //   .catch(
    //     function(err){
    //         return new Promise(function(resolve, reject) { reject('Error in Mongo: ' + err) ;} );
    //   });
    // }

    // Export Functions

    // module.exports.commServerProcess = commServerProcess;
    // module.exports.creatingAudit = creatingAudit;
    module.exports.createAuditLogs = createAuditLogs;
    module.exports.deviceActivityNotif = deviceActivityNotif;
    // module.exports.findType = findType;
    // module.exports.parseGetTypes = parseGetTypes;
    // module.exports.addInteractions = addInteractions;
    // module.exports.semanticValidation = semanticValidation;
    module.exports.getTypes = getTypes;
    module.exports.saveDocuments = saveDocuments;
    // module.exports.createInstance = createInstance;
    module.exports.updateItemsList = updateItemsList;
    module.exports.updateDocuments = updateDocuments;
