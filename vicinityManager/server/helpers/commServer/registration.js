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
  var aid = req.body.aid;
  var cont = 0; // Stores num of upserted documents

  nodeOp.findById(aid,{organisation:1},
    function(err,data){
        if(err || !data){
          res.json({"error": true, "message" : "Something went wrong..."});
        } else {
          var cid = data.organisation;
          cont = saveDocuments(aid, cid, objectsArray, cont);
          // deviceActivityNotif(cid);

          res.json({"error": false, "message" : cont + " documents were saved!"});

        }
    }
  );

}










/*
Create collection of item documents
*/
function saveDocuments(aid, cid, objectsArray, cont){
  var db = new itemOp();
  var obj = {};

  var creds = objectsArray[0].credentials; // Select first credentials object
  delete objectsArray[0].credentials;

  // Create one item document
  obj.aid = aid;
  obj.oid = objectsArray[0].oid;
  obj.name = creds.name; // Name goes in TD!!!
  obj.hasAdministrator = cid; // CID -- goes in message?
  obj.accessLevel = 1; // private by default
  obj.avatar = config.avatarItem; // Default avatar provided by VCNT
  obj.info = objectsArray[0]; // Thing description obj, might have different structures each time
  obj.markModified('info'); // Required when modifying schema of object, case of flexible object
  obj.status = 'enabled'; // TODO Change in future stages of the project

  db.update({oid: obj.oid} , { $set: obj }, { upsert: true },         // TODO Consider using bulk upsert instead
    function(err, data){
      if(err || !data){
        logger.debug("Item " + obj.name + " was not saved...");
      } else {
        commServerProcess(obj.oid, aid, creds.name, creds.password, cid);
      }
    }
  );

  objectsArray.splice(0,1); // Delete matched object of objectsArray

  if (objectsArray.length > 0 ){ // If credentials not empty, call recursively until all objects saved
    saveDocuments(aid, cid, objectsArray, cont);
  }

  return cont;
  
}

/*
Creates user in commServer
Adds user to company and agent groups
*/
function commServerProcess(docOid, docAid, docName, docPassword, docOwner){
  var payload = {
    username : docOid,
    name: docName,
    password: docPassword,
    };
  commServer.callCommServer(payload, 'users', 'POST')
    .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST'),callbackError) // Add to company group
    .then(commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAid, 'POST'), callbackError); // Add to agent group
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

/*
Find index containing same oid and return it
*/
function matchOid(elements){
  return elements.oid === this.oid;
}

// Export Functions

module.exports.postRegistration = postRegistration;
