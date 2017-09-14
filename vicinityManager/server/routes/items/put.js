// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var sharingRules = require('../../helpers/sharingRules');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;

// Public function 1

/*
Controls any possible object modification
- Change of status Enable/Disable
- Change of other properties
- Change of accessLevel
*/
function putOne(req, res) {
//TODO: User authentic - Role check

  var response = {};
  var uid = mongoose.Types.ObjectId(req.params.id); // Unique mongo ID
  var oid = req.body.oid; // Object ID - Generated out of VCNT manager
  var adid = req.body.adid; // Agent ID - Generated in VCNT manager
  var updates = req.body;

  if(updates.status === 'enabled'){
    commServerProcess(oid, adid, updates.name, oid, updates.cid)
      .then(function(response){ return deviceActivityNotif(uid, updates.cid, 'Enabled', 11);})
      .then(function(response){ itemUpdate(uid,updates,res);})
      .catch(callbackError);

  }else if(updates.status === 'disabled'){
    commServer.callCommServer({}, 'users/' + oid , 'DELETE')
      .then(function(response){ return deviceActivityNotif(uid, updates.cid, 'Disabled', 12);})
      .then(function(response){ itemUpdate(uid,updates,res);})
      .catch(callbackError);

  }else{

    itemUpdate(uid,updates,res);

  }
}

/*
Handles the accessLevel and other properties modifications
*/
function itemUpdate(uid,updates,res){
  if(updates.accessLevel && updates.accessLevel !== 0){
    if(!updates.status){
      query = { accessLevel: updates.accessLevel };
      logger.debug("Start update of accessLevel...");
    } else {
      query = {status: updates.status, accessLevel: updates.accessLevel};
      logger.debug("Start update of accessLevel and item activation/deactivation...");
    }
    itemOp.findOneAndUpdate({ _id : uid}, {$set: query }, function(err, raw){
      sharingRules.changePrivacy(updates);
      res.json({"error": err, "message": raw});
      logger.debug("Item update process ended successfully...");
      }
    );
  } else {
    itemOp.findOneAndUpdate({ _id : uid}, { $set: updates }, function(err, raw){
      res.json({"error": err, "message": raw});
      }
    );
  }
}

/*
Sends a notification on change of status
*/
function deviceActivityNotif(did,cid,state, typ){
  var dbNotif = new notificationOp();
  dbNotif.addressedTo = cid;
  dbNotif.sentBy = cid;
  dbNotif.itemId = did;
  dbNotif.type = typ;
  dbNotif.status = "info";
  dbNotif.isUnread = true;
  return dbNotif.save(
    function(err,data){
      if(err){
        logger.debug("Error creating the notification");
        return new Promise(function(resolve, reject) { reject("Error"); });
      } else {
        return new Promise(function(resolve, reject) { resolve("Done"); });
      }
    }
  );
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
Handles errors
*/
function callbackError(err){
  logger.debug('Error updating item: ' + err);
  // TODO some error handling ...
  // commServer.callCommServer({}, 'users/' + oid , 'DELETE')
}

// Module exports

module.exports.putOne = putOne;
