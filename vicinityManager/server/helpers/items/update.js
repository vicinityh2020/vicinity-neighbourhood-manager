/*
TODO Enable bulk update when needed
Make use on asyncHandler/sync module
*/

// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var sharingRules = require('../../helpers/sharingRules');
var audits = require('../../routes/audit/put');
// var sync = require('../../helpers/asyncHandler/sync');

var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var notificationOp = require('../../models/vicinityManager').notification;

//Public functions

/*
Enable items
*/
function enableItems(data, callback){
  var cid = data.cid.extid;
  var c_id = data.cid.id._id;
  var oid = data.oid;
  var o_id = data.id;
  var adid = data.adid;
  var userId = mongoose.Types.ObjectId(data.userId);
  var userMail = data.userMail;

  commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'POST')
    .then(function(response){ return deviceActivityNotif(o_id, c_id, 'Enabled', 11);})
    .then(function(response){
      return audits.putAuditInt(
        o_id,
        {
          orgOrigin: c_id,
          user: userMail,
          auxConnection: {kind: 'item', item: o_id},
          eventType: 43
        }
      );
    })
    .then(function(response){
      return audits.putAuditInt(
        c_id,
        {
          orgOrigin: c_id,
          user: userMail,
          auxConnection: {kind: 'item', item: o_id},
          eventType: 43
        }
      );
    })
    .then(function(response){ return manageUserItems(oid, o_id, userMail, userId, 'enabled'); })
    .then(function(response){
       var query = {status: data.status, accessLevel: data.accessLevel};
       return itemOp.findOneAndUpdate({ _id : o_id}, {$set: query});
     })
    .then(function(response){
      return sharingRules.changePrivacy(data);
      })
    .then(function(response){
      logger.debug("Item update process ended successfully...");
      logger.audit({user: userMail, action: 'EnableItem', item: o_id });
      callback(false, response);
    })
    .catch(function(err){
      logger.error({user: userMail, action: 'EnableItem', item: o_id, message: err});
      callback(true, err);
    });
}

/*
Disable items
*/
function disableItems(data, callback){
  var cid = data.cid.extid;
  var c_id = data.cid.id._id;
  var oid = data.oid;
  var o_id = data.id;
  var adid = data.adid;
  var userId = mongoose.Types.ObjectId(data.userId);
  var userMail = data.userMail;

  commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'DELETE')
    .then(function(response){ return deviceActivityNotif(o_id, c_id, 'Disabled', 12);})
    .then(function(response){
      return audits.putAuditInt(
        o_id,
        {
          orgOrigin: cid,
          user: userMail,
          auxConnection: {kind: 'item', item: o_id},
          eventType: 44
        }
      );
    })
    .then(function(response){
      return audits.putAuditInt(
        cid,
        {
          orgOrigin: cid,
          user: userMail,
          auxConnection: {kind: 'item', item: o_id},
          eventType: 44
        }
      );
    })
    .then(function(response){ return manageUserItems(oid, o_id, userMail, userId, 'disabled'); })
    .then(function(response){
       var query = {status: data.status, accessLevel: data.accessLevel};
       return itemOp.findOneAndUpdate({ _id : o_id}, {$set: query});
     })
    .then(function(response){
      return sharingRules.changePrivacy(data);
      })
    .then(function(response){
      logger.debug("Item update process ended successfully...");
      logger.audit({user: userMail, action: 'DisableItem', item: o_id });
      callback(false, response);
    })
    .catch(function(err){
      logger.error({user: userMail, action: 'DisableItem', item: o_id, message: err});
      callback(true, err);
    });
}

/*
Update items
*/
function updateItems(data, callback){
  var cid = data.cid.extid;
  var c_id = data.cid.id._id;
  // var oid = data.oid;
  var o_id = data.id;
  // var adid = data.adid;
  // var userId = mongoose.Types.ObjectId(data.userId);
  var userMail = data.userMail;

  audits.putAuditInt(
    o_id,
    {
      orgOrigin: cid,
      auxConnection: {kind: 'item', item: o_id},
      user: userMail,
      eventType: 45,
      description: "From " + clasify(Number(data.oldAccessLevel)) + " to " + clasify(Number(data.accessLevel))
    }
  )
  .then(function(response){
    var query = {};
    if(data.hasOwnProperty('accessLevel')){ query = {accessLevel: data.accessLevel}; }
    if(data.hasOwnProperty('avatar')){ query = {avatar: data.avatar}; }
    return itemOp.findOneAndUpdate({ _id : o_id}, { $set: query });
  })
  .then(function(response){
    logger.debug("Item update process ended successfully...");
    logger.audit({user: userMail, action: 'itemUpdate', item: o_id });
    callback(false, response);
  })
  .catch(function(err){
    logger.error({user: userMail, action: 'itemUpdate', item: o_id, message: err});
    callback(true, err);
  });
}

// Private functions

/*
Push or pull OID from service/device owner
Enable/Disable triggers the action
*/
function manageUserItems(oid, uid, email, userId, type){
  var item = {'id': uid, 'extid': oid};
  var user = type === 'enabled' ? {'id': userId, 'extid': email} : {};
  var query = type === 'enabled' ? {$push: {hasItems: item}} : {$pull: {hasItems: item}};
  return userOp.update({'email': email}, query)
  .then(function(response){
    return itemOp.update({_id:uid}, {$set: {uid: user }});
  });
}

/*
Sends a notification on change of status
*/
function deviceActivityNotif(did,cid,state,typ){
  var dbNotif = new notificationOp();
  return new Promise(
    function(resolve, reject) {
      dbNotif.addressedTo = cid;
      dbNotif.sentBy = cid;
      dbNotif.itemId = did;
      dbNotif.type = typ;
      dbNotif.status = "info";
      dbNotif.save(
        function(err,data){
          if(err){
            logger.debug("Error creating the notification");
            reject("Error");
          } else {
            resolve("Done");
          }
        }
      );
    }
  );
}

/*
Converts accessLevel number to actual data accessLevel caption
*/
function clasify(lvl){
    switch (lvl) {
        case 0:
            caption = "private";
            break;
        case 1:
            caption = "request friends";
            break;
        case 2:
            caption = "request public";
            break;
        default:
            caption = "private";
    }
    return caption;
}

// Module exports

module.exports.enableItems = enableItems;
module.exports.disableItems = disableItems;
module.exports.updateItems = updateItems;
