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
          // semanticRepo.getTypes("Device")
          // .then(function(response){ return parseGetTypes(JSON.parse(response).data.results.bindings); })
          // .then(function(response){ semanticTypes.devices = response;
          //                           return semanticRepo.getTypes("Service"); })
          // .then(function(response){ return parseGetTypes(JSON.parse(response).data.results.bindings); })
          // .then(function(response){
          //     semanticTypes.services = response;
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
                  if(allresult.length === objectsArray.length){
                    logger.debug('Completed async handler: ' + JSON.stringify(allresult));

                    updateItemsList(data.hasItems, allresult)
                    .then(function(response){ data.hasItems = response;
                                              return data.save(); })
                    .then(function(response){ return deviceActivityNotif(cid); })
                    .then(function(response){ res.json({"error": false, "message" : allresult});
                                              console.timeEnd("ALL REGISTRATION EXECUTION");
                                            })
                    .catch(function(err){ res.json({"error": true, "message" : "Error in final steps: " + err}); });
                  }
                },
                false,
                {adid: adid, cid:cid, data:data, types:semanticTypes} // additional parameters
              );
          //   }
          // )
          // .catch(function(err){res.json({"error": true, "message" : "Error in semantic repository: " + err});});
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
  var creds = objects.credentials; // Select credentials object
  delete objects.credentials; // Delete credentials, not to be stored in MONGO
  logger.debug('START execution with value =', creds.oid.toLowerCase());

  // Create one item document
  obj.adid = otherParams.adid;
  obj.oid = creds.oid.toLowerCase(); // Username in commServer
  obj.name = objects.name; // Name in commServer
  obj.hasAdministrator = otherParams.cid; // CID, obtained from mongo
  obj.accessLevel = 1; // private by default
  obj.avatar = config.avatarItem; // Default avatar provided by VCNT
  // obj.typeOfItem = findType(objects.type, otherParams.types); // Use collection of semanticTypes to find if service/device/unknown
  obj.typeOfItem = 'device';
  if(obj.typeOfItem === "unknown") {
    callback(obj.oid, "Unknown type...");
  } else {
    obj.info = objects; // Thing description obj, might have different structures each time
    obj.info.oid = creds.oid.toLowerCase();
    obj.status = 'disabled';

    itemOp.update({oid: obj.oid} , { $set: obj }, { upsert: true },         // TODO Consider using bulk upsert instead
      function(err, data){
        if(err || !data){
          logger.debug("Item " + obj.name + " was not saved...");
          callback(obj.oid, "error mongo" + err);
        } else {
          // callback(obj.oid, "success");
          commServerProcess(obj.oid, otherParams.adid, obj.name, obj.oid, otherParams.cid)
          .then(function(response){ callback(obj.oid, "Success"); })
          .catch(function(err){ callback(obj.oid, err); });
        }
      }
    );
  }
}

/*
Creates user in commServer
Adds user to company and agent groups
If the oid exists in the commServer is deleted and created anew
*/
function commServerProcess(docOid, docAdid, docName, docPassword, docOwner){
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
          .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
          .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
          .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
        },
        function(err){
          if(err.statusCode !== 404){
            return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); // return rejected promise because we got a non controlled error
          } else {
            return commServer.callCommServer(payload, 'users', 'POST')
            .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
            .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
            .catch(function(err){ return new Promise(function(resolve, reject) { reject('Error in commServer: ' + err) ;} ); } );
          }
        }
      );
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
  dbNotif.type = 13;
  dbNotif.status = "info";
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
