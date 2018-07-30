// Global Objects

var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var notifHelper = require('../../services/notifications/notificationsHelper');
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var map = require('../../configuration/map');
var commServer = require('../../services/commServer/request');
var semanticRepo = require('../../services/semanticRepo/request');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../services/audit/audit');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var crypto = require('crypto');

// Public Function -- Main

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function create(data, callback){
  var objectsArray = data.thingDescriptions;
  var adid = typeof data.adid !== 'undefined' ? data.adid : data.agid;

  // console.time("ALL REGISTRATION EXECUTION");
  // console.time("REGISTRATION FIX PART");

  nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1, type:1},
    function(err,data){
        if(err){
          callback(true, "Error in Mongo: " + err);
        }else if(!data){
          callback(true, "Invalid adid/agid identificator");
        } else {
          var nodeId = data._id;
          var nodeName = data.name;
          var cid = data.cid;
          var doSemanticValidation = config.enabledAdapters.indexOf(data.type[0]) !== -1;
          var adapterType = data.type[0] === "generic.adapter.sharq.eu" ? "shq" : "vcnt"; // TODO cover more types when needed
          var semanticTypes = {};

          // Get available item types in the semantic repository or static file
          getTypes(doSemanticValidation)
          .then(function(response){
            semanticTypes.services = response.services;
            semanticTypes.devices = response.devices;
            // console.timeEnd("REGISTRATION FIX PART");

            // Process new items internally
            sync.forEachAll(objectsArray,
              function(value, allresult, next, otherParams) { // Process all new items
                saveDocuments(value, otherParams, function(value, result) {
                    allresult.push({data: value, result: result});
                    next();
                });
              },
              function(allresult) {
                // Final part: Return results, update node and notify
                if(allresult.length === objectsArray.length){ // Only process final step if all the stack of tasks completed
                  logger.debug('Completed async handler: ' + JSON.stringify(allresult));
                  updateItemsList(data.hasItems, allresult)
                  .then(function(response){
                    data.hasItems = response;
                    return data.save();
                  })
                  .then(function(response){ return createAuditLogs(cid, allresult, adid); })
                  .then(function(response){
                    var finalRes = [];
                    var someSuccess = false; // true if some registration was successful
                    for(var item in allresult){
                      finalRes.push(allresult[item].data);
                      if(allresult[item].result === 'Success'){someSuccess = true;}
                    }
                    if(someSuccess){deviceActivityNotif(cid);} // Notify only if some item was registered
                    callback(false, finalRes);
                    // console.timeEnd("ALL REGISTRATION EXECUTION");
                  })
                  .catch(function(err){ callback(true, "Error in final steps: " + err); });
                  }
                },
                false,
                { adid: adid,
                  cid:cid,
                  nodeId: nodeId,
                  data:data,
                  types:semanticTypes,
                  semanticValidation:doSemanticValidation,
                  adapterType: adapterType,
                  nodeName: nodeName } // additional parameters
              );
            }
          )
          .catch(function(err){callback(true, err); });
        }
      }
    );
  }

// Private Functions

/*
Inserts or updates all oids in the request, depending on their previous existance
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
  obj.adid = {'id': otherParams.nodeId, 'extid': otherParams.adid, 'type': otherParams.adapterType, 'name': otherParams.nodeName};
  obj.name = objects.name; // Name in commServer
  obj.cid = otherParams.cid; // CID, obtained from mongo
  obj.accessLevel = 0; // private by default
  obj.avatar = config.avatarItem; // Default avatar provided by VCNT
  obj.infrastructureId = infra_id; // Need to map with agent
  obj.status = 'disabled';
  if(!objects.credentials && !objects.oid){ // Create a new instance in Mongo
    oidExist(uuid()) // Username in commServer & semanticRepo
    .then(function(response){
      obj.oid = response;
      if(otherParams.semanticValidation){
        objects.oid = response;
        semanticValidation(objects, obj, pwd, infra_id, callback);
      } else {
        obj.info = objects;
        obj.info.oid = obj.oid;
        createInstance(obj, pwd, infra_id, callback);
      }
    }) // Register TD in semantic repository
    .catch(function(err){callback({"infrastructure-id": infra_id, error: err}, err); });
  } else { // if the TD contains an OID, then we need to update the instance in Mongo (not create a new one)
    callback({"infrastructure-id": infra_id, error: "Your TD contained an OID, please consider update service instead"}, "Update service disabled, you cannot register TDs with OID");
  }
}

/*
Semantic validation
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
    logger.debug('error: ' + err);
    return objData;
  }
}

/*
Checks if the oid is in Mongo
If it is, creates a new one and checks again
Ensures oid uniqueness
*/
function oidExist(oid){
  return itemOp.findOne({oid: oid})
  .then(
    function(data){
      if(!data){
        return new Promise(function(resolve, reject) { resolve(oid) ;} );
      } else {
        oid = uuid();
        oidExist(oid);
      }
    })
  .catch(
    function(err){
        return new Promise(function(resolve, reject) { reject('Error in Mongo: ' + err) ;} );
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
Sends a notification to the organisation after successful discovery
*/
function deviceActivityNotif(cid){
  return notifHelper.createNotification(
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    'info', 13, null);
}

/*
Creates audit logs for each registered item
*/
function createAuditLogs(cid, ids, adid){
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
        {cid: cid, user: "Agent:" + adid, type: 41}
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
Get service and device types from semantic repo or static file
*/
function getTypes(fromSemantiRepo){
  return new Promise(function(resolve, reject) {
    var data = {};
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
      try{
        data.services = map.map.data.service;
        data.devices = map.map.data.device;
        resolve(data);
      } catch(err) {
        reject(err);
      }
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

// Export Functions
module.exports.create = create;
