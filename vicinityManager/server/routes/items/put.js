var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;


function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var payload = {
    username : o_id,
    name: updates.name,
    password: updates.password,
    };

  if(updates.status === 'enabled' && updates.modifyCommServer && updates.public){
    commServer.callCommServer(payload, 'users', 'POST', req.headers.authorization)
      .then(commServer.callCommServer({}, 'users/' + o_id + '/groups/' + updates.cid + '_ownDevs', 'POST', req.headers.authorization),callbackError) // Add to company group
      // .then(commServer.callCommServer({}, 'users/' + o_id + '/groups/' + agent_id, 'POST', req.headers.authorization)) // Add to agent group
      .then(commServer.callCommServer({}, 'users/' + o_id + '/groups/' + 'publicDevices', 'POST', req.headers.authorization),callbackError) // Add to public devices group
      .then(deviceActivityNotif(o_id, updates.cid, 'Enabled'),callbackError)
      .then(itemStatusUpdate(o_id,updates),callbackError);

  }else if(updates.status === 'enabled' && updates.modifyCommServer && !updates.public){
    commServer.callCommServer(payload, 'users', 'POST', req.headers.authorization)
      .then(commServer.callCommServer({}, 'users/' + o_id + '/groups/' + updates.cid + '_ownDevs', 'POST', req.headers.authorization),callbackError) // Add to company group
      // .then(commServer.callCommServer({}, 'users/' + o_id + '/groups/' + agent_id, 'POST', req.headers.authorization)) // Add to agent group
      .then(deviceActivityNotif(o_id, updates.cid, 'Enabled'),callbackError)
      .then(itemStatusUpdate(o_id,updates),callbackError);

  }else if(updates.status === 'disabled' && updates.modifyCommServer){
    commServer.callCommServer({}, 'users/' + o_id , 'DELETE', req.headers.authorization)
      .then(deviceActivityNotif(o_id, updates.cid, 'Disabled'),callbackError)
      .then(itemStatusUpdate(o_id,updates),callbackError);

  }else{
    if(updates.accessLevel === '4'){ // Add/removes devices from commServer shared public group
      commServer.callCommServer({}, 'users/' + o_id + '/groups/' + 'publicDevices', 'POST', req.headers.authorization);
    }else if(updates.accessLevel && updates.accessLevel !== '4'){
      commServer.callCommServer({}, 'users/' + o_id + '/groups/' + 'publicDevices', 'DELETE', req.headers.authorization);
    }
    itemOp.update({ "_id": o_id}, {$set: updates}, function(err, raw){
      if(!err){
        response = {"error": err, "message": raw};
        res.json(response);
      }else{
        logger.debug(err);
        res.json(err);
      }
    }
  );
}

function itemStatusUpdate(o_id,updates){
  return itemOp.update({ "_id": o_id}, {$set: {status: updates.status}}, function(err, raw){
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
    // commServer.callCommServer({}, 'users/' + o_id , 'DELETE', req.headers.authorization)
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
