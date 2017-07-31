// Global Objects

var mongoose = require('mongoose');
var ce = require('cloneextend');
var itemOp = require('../../models/vicinityManager').item;
var notifOp = require('../../models/vicinityManager').notification;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');

// Functions

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function postRegistration(req, res, next){
  var objectsArray = req.body.thingDescriptions;
  var adid = req.body.adid;
  var oidArray = [];

  nodeOp.findOne({adid: adid}, {organisation:1, hasItems: 1},
    function(err,data){
        if(err || !data){
          if(err){
            res.json({"error": true, "message" : "Something went wrong: " + err});
          }else{
            res.json({"error": true, "message" : "Invalid adid identificator"});
          }
        } else {
          var cid = data.organisation;
          oidArray = saveDocuments(adid, cid, objectsArray, oidArray);
          data.hasItems = updateItemsList(data.hasItems, oidArray);
          data.save();
          deviceActivityNotif(cid);
          res.json({"error": false, "message" : "Documents were saved!"});
        }
    }
  );
}

/*
Inserts or updates all oids in the request, depending on their previous existance
*/
function saveDocuments(adid, cid, objectsArray, oidArray){

  var obj = {};

  var creds = objectsArray[0].credentials; // Select credentials object
  delete objectsArray[0].credentials; // Delete credentials, not to be stored in MONGO

  // Create one item document
  obj.adid = adid;
  obj.oid = objectsArray[0].oid;
  obj.name = creds.name; // Name goes in TD!!!
  obj.hasAdministrator = cid; // CID, obtained from mongo
  obj.accessLevel = 1; // private by default
  obj.avatar = config.avatarItem; // Default avatar provided by VCNT
  obj.typeOfItem = 'device';
  obj.info = objectsArray[0]; // Thing description obj, might have different structures each time
  obj.status = 'enabled'; // TODO Change in future stages of the project

  itemOp.update({oid: obj.oid} , { $set: obj }, { upsert: true },         // TODO Consider using bulk upsert instead
    function(err, data){
      if(err || !data){
        logger.debug("Item " + obj.name + " was not saved...");
      } else {
        commServerProcess(obj.oid, adid, creds.name, creds.password, cid);
      }
    }
  );

  oidArray.push(obj.oid);
  objectsArray.splice(0,1); // Delete first object of objectsArray

  if (objectsArray.length > 0 ){ // If objectsArray not empty, call recursively until all objects saved
    saveDocuments(adid, cid, objectsArray, oidArray);
  }

  return oidArray;

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

    commServer.callCommServer({}, 'users/' +  docOid, 'GET')
      .then(
        function(response){
          commServer.callCommServer(payload, 'users/' +  docOid, 'DELETE') // DELETE + POST instead of PUT because the OID might have changed the agent
            .then(
              function(response){
                commServer.callCommServer(payload, 'users', 'POST')
                .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST'), callbackError) // Add to company group
                .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST'), callbackError) // Add to agent group
                .catch(callbackError);
            },
            function(error){
              callbackError(error);
            }
          );
        },
        function(error){
          if(error.statusCode !== 404){
          callbackError(error);
        } else {
          commServer.callCommServer(payload, 'users', 'POST')
            .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST'),callbackError) // Add to company group
            .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST'), callbackError) // Add to agent group
            .catch(callbackError);
        }
      }
    );
}

/*
Adds all new oids to the node hasItems
If the oid is already in there skip it
*/
function updateItemsList(items, oidArray){
  var flag = items.indexOf(oidArray[0]);
  if(flag === -1){
    items.push(oidArray[0]);
  }
  oidArray.splice(0,1);
  if(oidArray.length > 0){
    updateItemsList(items, oidArray);
  }
  return items;
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
  dbNotif.save();
}

/*
Handle errors in the commServer
*/
function callbackError(err){
  logger.debug('Error updating item: ' + err);
  // TODO some error handling ...
  // commServer.callCommServer({}, 'users/' + o_id , 'DELETE')
}

// Export Functions

module.exports.postRegistration = postRegistration;
