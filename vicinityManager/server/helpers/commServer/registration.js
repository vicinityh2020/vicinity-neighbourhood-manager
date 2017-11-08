// Global Objects

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var notifOp = require('../../models/vicinityManager').notification;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');
var semanticRepo = require('../../helpers/semanticRepo/request');
var sync = require('../../helpers/asyncHandler/sync');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator

// Public Function -- Main

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function postRegistration(req, res, next){
  var objectsArray = req.body.thingDescriptions;
  var adid = req.body.adid;

  console.time("ALL REGISTRATION EXECUTION");
  console.time("REGISTRATION FIX PART");

  nodeOp.findOne({adid: adid, status: "active"}, {organisation:1, hasItems: 1},
    function(err,data){
        if(err || !data){
          if(err){
            res.json({"error": true, "message" : "Error in Mongo: " + err});
          }else{
            res.json({"error": true, "message" : "Invalid adid identificator"});
          }
        } else {
          var cid = data.organisation;
          var semanticTypes = {};
          // Get available item types in the semantic repository
          semanticRepo.getTypes("Device")
          .then(function(response){ return parseGetTypes(JSON.parse(response).data.results.bindings); })
          .then(function(response){ semanticTypes.devices = response;
                                    return semanticRepo.getTypes("Service"); })
          .then(function(response){ return parseGetTypes(JSON.parse(response).data.results.bindings); })
          .then(function(response){
              semanticTypes.services = response;
              console.timeEnd("REGISTRATION FIX PART");
              // Process new items internally
              sync.forEachAll(objectsArray,
                function(value, allresult, next, otherParams) { // Process all new items
                  saveDocuments(value, otherParams, function(value, result) {
                      logger.debug('END execution with value =', value, 'and result =', result);
                      allresult.push({value: value, result: result});
                      next();
                  });
                },
                function(allresult) {
                  // Final part: Return results, update node and notify
                  if(allresult.length === objectsArray.length){ // Only process final step if all the stack of tasks completed
                    logger.debug('Completed async handler: ' + JSON.stringify(allresult));
                    updateItemsList(data.hasItems, allresult)
                    .then(function(response){ data.hasItems = response;
                                              return data.save(); })
                    .then(function(response){ return deviceActivityNotif(cid); })
                    .then(function(response){
                                            res.json({"status": 200, "message": allresult});
                                            console.timeEnd("ALL REGISTRATION EXECUTION");
                                            })
                    .catch(function(err){ res.json({"error": true, "message" : "Error in final steps: " + err}); });
                  }
                },
                false,
                {adid: adid, cid:cid, data:data, types:semanticTypes} // additional parameters
              );
            }
          )
          .catch(function(err){res.json({"error": true, "message" : "Error: " + err});});
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

  // Create one item document
  obj.typeOfItem = findType(objects.type, otherParams.types); // Use collection of semanticTypes to find if service/device/unknown
  if(obj.typeOfItem === "unknown") {
    callback("No OID", "Unknown type...");
  } else {
    // Adding important fields for Vicinity
    obj.adid = otherParams.adid;
    obj.name = objects.name; // Name in commServer
    obj.hasAdministrator = otherParams.cid; // CID, obtained from mongo
    obj.accessLevel = 1; // private by default
    obj.avatar = config.avatarItem; // Default avatar provided by VCNT
    obj.status = 'disabled';
    if(!objects.credentials && !objects.oid){ // Create a new instance in Mongo
      oidExist(uuid()) // Username in commServer & semanticRepo
      .then(function(response){
        obj.oid = response;
        objects.oid = response;
        objects.uuid = response;
        return semanticRepo.registerItem(objects); }) // Register TD in semantic repository
      .then(function(response){
        var repoAnswer = JSON.parse(response);
        if(!(repoAnswer.data.hasOwnProperty('errors'))) {
          obj.info = JSON.parse(response).data.lifting; // Thing description obj, stores response from semanticRepo
          createInstance(new itemOp(obj), callback);
        } else { // If lifting ends with error ...
          callback(obj.oid, "Error semantic repository: " + repoAnswer.data.errors);
        }
      })
      .catch(function(err){callback(obj.oid, "Error: " + err); });
      //createInstance(obj, callback)
    } else { // if the TD contains an OID, then we need to update the instance in Mongo (not create a new one)
      callback("Null", "Update service disabled, you cannot register TDs with OID");
      // obj.oid = objects.credentials.oid;
      // var pass = objects.credentials.password;
      // delete(objects.credentials);
      // obj.info = objects; // Thing description obj, might have different structures each time
      // obj.info.oid = obj.oid;
      // updateInstance(obj, pass, callback);
    }
  }
}

/*
Totally new TD --> Expects new instance to be created
*/
function createInstance(obj, callback){
  obj.save(
    function(err, response){
      if(err){
        callback(obj.oid, "Error Mongo Creating Instance: " + err);
      } else {
        callback(obj.oid, "Success");
      }
    });
}

/*
TD contains a credentials field.
Meaning: a) Agent sends old version of the TD (now NM should create OID)
         b) Agent wants to update an existing TD
*/
// function updateInstance(obj, pass, callback){
//   itemOp.update({oid: obj.oid} , { $set: obj }, { upsert: true },   // keep upsert in case the TD did not exist (control possible errors in the TD)
//     function(err, data){
//       if(err){
//         logger.debug("Item " + obj.name + " was not saved...");
//         callback(obj.oid, "error mongo" + err);
//       } else {
//         commServer.callCommServer({username: obj.oid, name: obj.name, password: pass}, 'users/' +  obj.oid, 'DELETE')
//           .then(function(response){ callback(obj.oid, "Success"); })
//           .catch(function(err){
//               if(err.statusCode !== 404){
//                 callback(obj.oid, "Error comm server: " + err);
//               } else {
//                 callback(obj.oid, "Success");
//               }
//             }
//           );
//         // commServerProcess(obj.oid, otherParams.adid, obj.name, creds.password, otherParams.cid)
//         // .then(function(response){ callback(obj.oid, "Success"); })
//         // .catch(function(err){ callback(obj.oid, err); });
//       }
//     }
//   );
// }

/*
Creates user in commServer
Adds user to company and agent groups
If the oid exists in the commServer is deleted and created anew
*/
// function commServerProcess(docOid, docAdid, docName, docPassword, docOwner){
//   var payload = {
//     username : docOid,
//     name: docName,
//     password: docPassword,
//     };
//     return commServer.callCommServer({}, 'users/' +  docOid, 'GET')
//       .then(
//         function(response){
//           return commServer.callCommServer(payload, 'users/' +  docOid, 'DELETE') // DELETE + POST instead of PUT because the OID might have changed the agent
//           .then(function(response){ return commServer.callCommServer(payload, 'users', 'POST');})
//           .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
//           .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
//           .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
//         },
//         function(err){
//           if(err.statusCode !== 404){
//             return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); // return rejected promise because we got a non controlled error
//           } else {
//             return commServer.callCommServer(payload, 'users', 'POST')
//             .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
//             .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
//             .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
//           }
//         }
//       );
//     }

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
      var oidArray = [];
      for(var i = 0; i < allresult.length; i++) {
        if(allresult[i].result === "Success"){oidArray.push(allresult[i].value);}
      }
      var flag = 0;
      for(var j = 0; j < oidArray.length; j++){
        flag = items.indexOf(oidArray[j]);
        if(flag === -1){
          items.push(oidArray[j]);
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
  dbNotif.addressedTo = cid;
  dbNotif.sentBy = cid;
  dbNotif.type = "deviceDiscovered";
  dbNotif.status = "waiting";
  dbNotif.isUnread = true;
  return dbNotif.save();
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

// Export Functions
module.exports.postRegistration = postRegistration;
