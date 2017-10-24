// Global Objects

var mongoose = require('mongoose');
var ce = require('cloneextend');
var itemOp = require('../../models/vicinityManager').item;
var notifOp = require('../../models/vicinityManager').notification;
var nodeOp = require('../../models/vicinityManager').node;
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');
var sync = require('../../helpers/asyncHandler/sync');

// Functions

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function postRegistration(req, res, next){
  var objectsArray = req.body.thingDescriptions;
  var adid = req.body.adid;

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
          // get item types - static service

          sync.forEachAll(objectsArray,
            function(value, allresult, next, otherParams) { // Process all new items
              saveDocuments(value, otherParams, function(value, result) {
                  logger.debug('END execution with value =', value, 'and result =', result);
                  allresult.push({value: value, result: result});
                  next();
              });
            },
            function(allresult) { // Final part: Return results, update node and notify
                logger.debug('Completed async handler: ' + JSON.stringify(allresult));
                var oidArray = [];
                for(var i = 0; i < allresult.length; i++) {
                  oidArray.push(allresult[i].value);
                }
                data.hasItems = updateItemsList(data.hasItems, oidArray);
                data.save();
                deviceActivityNotif(cid);
                res.json({"error": false, "message" : allresult});
            },
            true,
            {adid: adid, cid:cid, data:data} // additional parameters
          );
        }
      }
    );
  }

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
  obj.typeOfItem = 'device';
  obj.info = objects; // Thing description obj, might have different structures each time
  obj.info.oid = creds.oid.toLowerCase();
  obj.status = 'disabled'; // TODO Change in future stages of the project

  itemOp.update({oid: obj.oid} , { $set: obj }, { upsert: true },         // TODO Consider using bulk upsert instead
    function(err, data){
      if(err || !data){
        logger.debug("Item " + obj.name + " was not saved...");
        callback(obj.oid, "error mongo" + err);
      } else {
        commServerProcess(obj.oid, otherParams.adid, obj.name, creds.password, otherParams.cid, callback);
      }
    }
  );
}

/*
Creates user in commServer
Adds user to company and agent groups
If the oid exists in the commServer is deleted and created anew
*/
function commServerProcess(docOid, docAdid, docName, docPassword, docOwner, callback){
  var payload = {
    username : docOid,
    name: docName,
    password: docPassword,
    };
    return commServer.callCommServer({}, 'users/' +  docOid, 'GET')
      .then(function(response){
        return commServer.callCommServer(payload, 'users/' +  docOid, 'DELETE') // DELETE + POST instead of PUT because the OID might have changed the agent
        .then(function(response){ return commServer.callCommServer(payload, 'users', 'POST');})
        .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
        .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
        .then(function(ans){callback(docOid, "Success");})
        .catch(function(err){callback(docOid, 'error commServer: ' + err);} );
      },
        function(err){
          if(err.statusCode !== 404){
            callback(docOid, 'error commServer: ' + err); // return rejected promise because we got a non controlled error
        } else {
          return commServer.callCommServer(payload, 'users', 'POST')
          .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docOwner + '_ownDevices', 'POST');}) // Add to company group
          .then(function(response){ return commServer.callCommServer({}, 'users/' + docOid + '/groups/' + docAdid, 'POST');}) // Add to agent group
          .then(function(ans){callback(docOid, "Success");})
          .catch(function(err){callback(docOid, 'error commServer: ' + err);} );
        }
      }
    );
  }

/*
Adds all new oids to the node hasItems
If the oid is already in there skip it
*/
function updateItemsList(items, oidArray){
  // get oids only if doc saved succesfully
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

// Export Functions

module.exports.postRegistration = postRegistration;
