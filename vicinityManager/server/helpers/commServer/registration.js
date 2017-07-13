// Global Objects

var mongoose = require('mongoose');
var ce = require('cloneextend');
var itemOp = require('../../models/vicinityManager').item;
var notifOp = require('../../models/vicinityManager').notification;
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');

// Functions

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function postRegistration(req, res, next){
  var documents = [];
  var credentialsArray = req.body.creds;
  var objectsArray = req.body.thingDescriptions;
  var cid = req.body.thingDescriptions[0].owner;
  var aid = req.body.aid;

  documents = createCollection(aid, credentialsArray, objectsArray, documents);
  var numItemsSaved = saveDocument(documents);
  deviceActivityNotif(cid);

  res.json({"error": false, "message" : numItemsSaved + " documents were saved!"});
}

/*
Create collection of item documents
*/
function createCollection(aid, credentialsArray, objectsArray, documents){
  var db = new itemOp();
  var objects = {};
  var creds = credentialsArray[0]; // Select first credentials object
  credentialsArray.splice(0,1); // Remove first element of credentials
  var pos = objectsArray.findIndex(matchOid, creds); // Find right object by matching oid of credentials in objects
  objects = objectsArray[pos];
  objectsArray.splice(pos,1); // Delete matched object of objectsArray

  // Create one item document
  db.aid = aid;
  db.oid = creds.oid;
  db.name = creds.credentials.name; // Name goes in TD!!!
  db.hasAdministrator = objects.owner; // CID -- goes in message?
  db.accessLevel = 1; // private by default
  db.avatar = config.avatarItem; // Default avatar provided by VCNT
  db.info = objects; // Thing description obj, might have different structures each time
  db.markModified('info'); // Required when modifying schema of object, case of flexible object
  db.status = 'enabled'; // TODO Change in future stages of the project
  db.type = 'device'; // TODO Change once we have services available

  documents.push(db);
  commServerProcess(creds.oid, aid, creds.credentials.name, creds.credentials.password, objects.owner);

  if (credentialsArray.length > 0 ){ // If credentials not empty, call recursively until all objects saved
    createCollection(aid, credentialsArray, objectsArray, documents);
  }
  return documents;
}

/*
Save documents in one bulk operation
On success, return an array with the successful operations
*/
function saveDocument(documents){
    var db = new itemOp();
    db.collection.insert(documents,
      function(err, docs) {
        if (err) {
        // TODO: handle error
        res.json({"error":true});
      } else {
        logger.debug(docs.result.n + ' documents were saved!');
        return docs.result.n;
      }
    }
  );
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
