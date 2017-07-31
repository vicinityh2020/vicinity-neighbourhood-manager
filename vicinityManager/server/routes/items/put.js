// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var commServerSharing = require('../../helpers/commServer/sharingRules');
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
  var oid = req.body.oid; // Object ID - Generated out of mongo
  var adid = req.body.adid; // Agent ID - Generated ?? Not sure yet
  var updates = req.body;
  var payload = {
    username : oid,
    name: updates.name,
    password: updates.password,
    };

  if(updates.status === 'enabled'){
    commServer.callCommServer(payload, 'users', 'POST')
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + updates.cid + '_ownDevices', 'POST'),callbackError) // Add to company group
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + adid, 'POST')) // Add to agent group
      .then(deviceActivityNotif(uid, updates.cid, 'Enabled'),callbackError)
      .then(itemStatusUpdate(uid,updates,res),callbackError);

  }else if(updates.status === 'disabled'){
    commServer.callCommServer({}, 'users/' + oid , 'DELETE')
      .then(deviceActivityNotif(uid, updates.cid, 'Disabled'),callbackError)
      .then(itemStatusUpdate(uid,updates,res),callbackError);

  }else{

    itemUpdate(uid,updates,res);

  }
}

/*
Handles the status update in MONGO
*/
function itemStatusUpdate(uid,updates,res){
  return itemOp.update({ "_id": uid}, {$set: {status: updates.status, accessLevel: 1}}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
    }
  );
}

/*
Handles the accessLevel and other properties modifications
*/
function itemUpdate(uid,updates,res){
  if(updates.accessLevel && updates.accessLevel !== 0){
    query = { accessLevel: updates.accessLevel };
    itemOp.findOneAndUpdate({ _id : uid}, {$set: query }, function(err, raw){
      commServerSharing.changePrivacy(updates);
      response = {"error": err, "message": raw};
      res.json(response);
      }
    );
  } else {
    itemOp.findOneAndUpdate({ _id : uid}, { $set: updates }, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
      }
    );
  }
}

/*
Sends a notification on change of status
*/
function deviceActivityNotif(did,cid,state){
  var dbNotif = new notificationOp();
  dbNotif.addressedTo = cid;
  dbNotif.sentBy = cid;
  dbNotif.deviceId = did;
  dbNotif.type = "device" + state;
  dbNotif.status = "waiting";
  dbNotif.isUnread = true;
  return dbNotif.save(
    function(err,data){
      if(err){
        logger.debug("Error creating the notification");
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

// Public function 2

function delIdFromHasAccessAndAccessRequestFrom(adminId, friendId){
    itemOp.find({ hasAdministrator: {$in : [adminId]}, accessRequestFrom: {$in : [friendId]}},function(err, data){
        var dev = {};
        var index;
        for (index in data){
          dev = data[index];

          for (var index2 = dev.accessRequestFrom.length - 1; index >= 0; index --) {
              if (dev.accessRequestFrom[index2].toString() === friendId.toString()) {
                  dev.accessRequestFrom.splice(index2, 1);
              }
          }
          dev.save();
        }
    });
    itemOp.find({ hasAdministrator: {$in : [adminId]}, hasAccess: {$in : [friendId]}},function(err, data){
        var dev = {};
        var index;
        for (index in data){
          dev = data[index];
          var index2;
          for (index2 = dev.hasAccess.length - 1; index >= 0; index --) {
              if (dev.hasAccess[index2].toString() === friendId.toString()) {
                  dev.hasAccess.splice(index2, 1);
              }
          }
          dev.save();
        }
      }
    );
  }


// Module exports

module.exports.putOne = putOne;
module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
