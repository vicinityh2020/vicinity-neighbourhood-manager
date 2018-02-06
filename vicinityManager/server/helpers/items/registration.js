// Global Objects

var itemOp = require('../../models/vicinityManager').item;
var notifOp = require('../../models/vicinityManager').notification;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');
var semanticRepo = require('../../helpers/semanticRepo/request');
var sync = require('../../helpers/asyncHandler/sync');
var audits = require('../../routes/audit/put');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var crypto = require('crypto');

// Public Function -- Main

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function create(data, callback){
  var objectsArray = data.thingDescriptions;
  var adid = data.adid;

  console.time("ALL REGISTRATION EXECUTION");
  console.time("REGISTRATION FIX PART");

  nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1},
    function(err,data){
        if(err || !data){
          if(err){
            callback(true, "Error in Mongo: " + err);
          }else{
            callback(true, "Invalid adid identificator");
          }
        } else {
          var nodeId = data._id;
          var cid = data.cid;
          var semanticTypes = {};
          // Get available item types in the semantic repository
          semanticRepo.getTypes("Device")
          .then(function(response){
            return parseGetTypes(JSON.parse(response).data.results.bindings);
          })
          .then(function(response){
            semanticTypes.devices = response;
            return semanticRepo.getTypes("Service");
          })
          .then(function(response){
            return parseGetTypes(JSON.parse(response).data.results.bindings);
          })
          .then(function(response){
            semanticTypes.services = response;
            console.timeEnd("REGISTRATION FIX PART");
            // Process new items internally
            sync.forEachAll(objectsArray,
              function(value, allresult, next, otherParams) { // Process all new items
                saveDocuments(value, otherParams, function(value, result) {
                    //logger.debug('END execution with value =', value, 'and result =', result);
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
                  .then(function(response){ return deviceActivityNotif(cid); })
                  .then(function(response){ return createAuditLogs(cid, allresult, adid); })
                  .then(function(response){
                    var finalResult = [];
                    for(var item in allresult){
                      if(allresult[item].result === "Success"){
                        finalResult.push({
                          oid: allresult[item].data.oid,
                          password: allresult[item].data.password,
                          "infrastructure-id": allresult[item].data["infrastructure-id"]
                        });
                      }
                    }
                    callback(false, finalResult);
                    console.timeEnd("ALL REGISTRATION EXECUTION");
                  })
                  .catch(function(err){ callback(true, "Error in final steps: " + err); });
                  }
                },
                false,
                {adid: adid, cid:cid, nodeId: nodeId, data:data, types:semanticTypes} // additional parameters
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

  // Create one item document
  obj.typeOfItem = findType(objects.type, otherParams.types); // Use collection of semanticTypes to find if service/device/unknown
  if(obj.typeOfItem === "unknown") {
    callback({oid: "NONE", password: "NONE", "infrastructure-id": "NONE"}, "Unknown type...");
  } else {
    // Adding important fields for Vicinity
    obj.adid = {'id': otherParams.nodeId, 'extid': otherParams.adid};
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
        objects.oid = response;
        return semanticRepo.callSemanticRepo(objects, "td/create", "POST"); }) // Register TD in semantic repository
      .then(function(response){
        var repoAnswer = JSON.parse(response);
        if(!(repoAnswer.data.hasOwnProperty('errors'))) {
          //logger.debug(repoAnswer);
          obj.info = JSON.parse(response).data.lifting; // Thing description obj, stores response from semanticRepo
          createInstance(new itemOp(obj), pwd, infra_id, callback);
        } else { // If lifting ends with error ...
          callback({oid: obj.oid, password: "NONE", "infrastructure-id": "NONE"}, repoAnswer.data.errors);
        }
      })
      .catch(function(err){callback({oid: obj.oid, password: "NONE", "infrastructure-id": "NONE"}, err); });
    } else { // if the TD contains an OID, then we need to update the instance in Mongo (not create a new one)
      callback({oid: "NONE", password: "NONE", "infrastructure-id": "NONE"}, "Update service disabled, you cannot register TDs with OID");
    }
  }
}

/*
Totally new TD --> Expects new instance to be created
*/
function createInstance(obj, pwd, infra_id, callback){
  obj.save()
  .then(function(response){
    return commServerProcess(obj.oid, obj.name, pwd);
  })
  .then(function(response){
    callback({oid: obj.oid, password: pwd, "infrastructure-id": infra_id, id: obj._id}, "Success");
  })
  .catch(function(err){
    callback({oid: obj.oid, password: "NONE", infra_id: "NONE"}, err);
  });
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
            items.push({id: allresult[j].data.id, extid: allresult[j].data.oid});
          }
        }
      } else {
        for(j = 0; j < allresult.length; j++){
          if(allresult[j].result === "Success"){
            items.push({id: allresult[j].data.id, extid: allresult[j].data.oid});
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
  var dbNotif = new notifOp();
  dbNotif.addressedTo = cid.id;
  dbNotif.sentBy = cid.id;
  dbNotif.type = 13;
  dbNotif.status = "info";
  return dbNotif.save();
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
                // logger.debug('END execution with value =', value, 'and result =', result);
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
        {orgOrigin: cid, user: "Agent:" + adid, eventType: 41, auxConnection: {kind: 'item'}}
      );
    } catch(err){
      reject("Error creating audits: " + err);
    }
  });
}

function creatingAudit(ids, data, callback){
  if(ids.result === 'Success'){
    data.auxConnection.item = ids.data.id;
    var cid = data.orgOrigin.id.toString();
    audits.putAuditInt(ids.data.id, data)
    .then(function(response){ return audits.putAuditInt(cid,data); })
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
      var myTypes = []; // store types
      var pos = 0; // keeps position in the string where the actual type starts
      var aux = ""; // keeps the value for each iteration
      for(var i=0; i<arr.length; i++){
        aux = arr[i].s.value;
        pos = aux.indexOf('#',0);
        myTypes.push(aux.substr(pos+1));
      }
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
//           .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
//           .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
          .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
        },
        function(err){
          if(err.statusCode !== 404){
            return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); // return rejected promise because we got a non controlled error
          } else {
            return commServer.callCommServer(payload, 'users', 'POST')
//             .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
//             .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
            .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
          }
        }
      );
    }

// Export Functions
module.exports.create = create;
