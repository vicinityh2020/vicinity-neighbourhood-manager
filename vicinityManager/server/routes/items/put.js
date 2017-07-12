var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;


function putOne(req, res) {
//TODO: User authentic - Role check

  var response = {};
  var uid = mongoose.Types.ObjectId(req.params.id); // Unique mongo ID
  var oid = req.body.oid; // Object ID - Generated out of mongo
  var aid = req.body.aid; // Agent ID - Generated ?? Not sure yet
  var updates = req.body;
  var payload = {
    username : oid,
    name: updates.name,
    password: updates.password,
    };

  if(updates.status === 'enabled' && updates.modifyCommServer && updates.public){
    commServer.callCommServer(payload, 'users', 'POST', req.headers.authorization)
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + updates.cid + '_ownDevices', 'POST'),callbackError) // Add to company group
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + aid, 'POST')) // Add to agent group
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + 'publicDevices', 'POST'),callbackError) // Add to public devices group
      .then(deviceActivityNotif(uid, updates.cid, 'Enabled'),callbackError)
      .then(itemStatusUpdate(uid,updates),callbackError);

  }else if(updates.status === 'enabled' && updates.modifyCommServer && !updates.public){
    commServer.callCommServer(payload, 'users', 'POST')
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + updates.cid + '_ownDevices', 'POST'),callbackError) // Add to company group
      .then(commServer.callCommServer({}, 'users/' + oid + '/groups/' + aid, 'POST')) // Add to agent group
      .then(deviceActivityNotif(uid, updates.cid, 'Enabled'),callbackError)
      .then(itemStatusUpdate(uid,updates),callbackError);

  }else if(updates.status === 'disabled' && updates.modifyCommServer){
    commServer.callCommServer({}, 'users/' + oid , 'DELETE')
      .then(deviceActivityNotif(uid, updates.cid, 'Disabled'),callbackError)
      .then(itemStatusUpdate(uid,updates),callbackError);

  }else{
    if(updates.accessLevel === '8'){ // Add/removes devices from commServer shared public group
      commServer.callCommServer({}, 'users/' + oid + '/groups/' + 'publicDevices', 'POST')
      .then(itemAccessLevelUpdate(uid,updates),callbackError);
    }else if(updates.accessLevel !== '8'){
      commServer.callCommServer({}, 'users/' + oid + '/groups/' + 'publicDevices', 'DELETE')
      .then(itemAccessLevelUpdate(uid,updates),callbackError);
    }
  }

function itemStatusUpdate(uid,updates){
  return itemOp.update({ "_id": uid}, {$set: {status: updates.status}}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
    }
  );
}

function itemAccessLevelUpdate(uid,updates){
  var aL = Number(updates.accessLevel);
  var query = { 'accessLevel' : aL };
  return itemOp.findOneAndUpdate({ _id : uid}, {$set: query }, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
    }
  );
}

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

  function callbackError(err){
    logger.debug('Error updating item: ' + err);
    // TODO some error handling ...
    // commServer.callCommServer({}, 'users/' + oid , 'DELETE')
  }

}



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

module.exports.putOne = putOne;
module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
