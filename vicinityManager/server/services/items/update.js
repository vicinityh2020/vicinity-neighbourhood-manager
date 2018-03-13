/*
TODO Enable bulk update when needed
Make use on asyncHandler/sync module
*/

// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../services/commServer/request');
var sharingRules = require('../../services/sharingRules');
var audits = require('../../controllers/audit/put');
var sync = require('../../services/asyncHandler/sync');

var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var notifHelper = require('../../services/notifications/notificationsHelper');

//Public functions

/*
Update several items
Can choose to execute any of the actions below for each item.
OPTIONS: Enable, disable, update metadata/accessLevel/avatar ...
*/
function updateManyItems(items, roles, email, cid, c_id, uid, callback){

  if(items.length !== 0){ // Check if there is any item to update
    logger.debug('Start async handler...');
    sync.forEachAll(items,
      function(value, allresult, next, otherParams) {
        if(value.status === 'enabled'){
          enableItem(value, otherParams, function(value, result, success) {
            allresult.push({value: value, error: result, success: success});
            next();
          });
        }else if(value.status === 'disabled'){
          disableItem(value, otherParams, function(value, result, success) {
            allresult.push({value: value, error: result, success: success});
            next();
          });
        } else {
          updateItem(value, otherParams, function(value, result, success) {
            allresult.push({value: value, error: result, success: success});
            next();
          });
        }
      },
      function(allresult) {
        if(allresult.length === items.length){
          logger.debug('Completed async handler: ' + JSON.stringify(allresult));
          callback(false, allresult);
        }
      },
      false,
      {roles: roles, email: email, cid:cid, c_id:c_id, uid:uid}
    );
  }
}

/*
Enable items
*/
function enableItem(data, otherParams, callback){
  var cid = otherParams.cid;
  var c_id = otherParams.orgid;
  var oid = data.oid;
  var o_id = data.o_id;
  var userId = otherParams.uid;
  var userMail = otherParams.email;
  var canChange = checkUserAuth(otherParams.roles, otherParams.email, data.typeOfItem, data.uid);

  if(canChange){
    commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'POST')
      .then(function(response){ return deviceActivityNotif({id: userId, extid: userMail}, {id: o_id, extid: oid}, {extid: cid, id: c_id}, 'Enabled', 11);})
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
        callback(false, response, true);
      })
      .catch(function(err){
        logger.error({user: userMail, action: 'EnableItem', item: o_id, message: err});
        callback(true, err, false);
      });
    } else {
      callback(false, 'User not authorized', false);
    }
}

/*
Disable items
*/
function disableItem(data, otherParams, callback){
  var cid = otherParams.cid;
  var c_id = otherParams.orgid;
  var oid = data.oid;
  var o_id = data.o_id;
  var userId = otherParams.uid;
  var userMail = otherParams.email;
  var canChange = checkUserAuth(otherParams.roles, otherParams.email, data.typeOfItem, data.uid);

  if(canChange){
    commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'DELETE')
      .then(function(response){ return deviceActivityNotif({id: userId, extid: userMail}, {id: o_id, extid: oid}, {extid: cid, id: c_id}, 'Disabled', 12);})
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
        callback(false, response, true);
      })
      .catch(function(err){
        logger.error({user: userMail, action: 'DisableItem', item: o_id, message: err});
        callback(true, err, false);
      });
    } else {
      callback(false, 'User not authorized', false);
    }
}

/*
Update items
*/
function updateItem(data, otherParams, callback){
  var cid = otherParams.cid;
  var c_id = otherParams.c_id;
  var oid = data.oid;
  var o_id = data.o_id;
  var userId = otherParams.uid;
  var userMail = otherParams.email;
  var query = {};
  var canChange = checkUserAuth(otherParams.roles, otherParams.email, data.typeOfItem, data.uid);

  if(canChange){
    if(data.hasOwnProperty('accessLevel')){

      userOp.findOne({_id:userId}, {accessLevel:1}, function(err, response){
        if(err){
          callback(true, err, false);
        } else if(Number(response.accessLevel) < Number(data.accessLevel)){
          logger.debug("User privacy is too low...");
          callback(false, "User privacy is too low...", false);
        } else {
          query = {accessLevel: data.accessLevel};
          itemOp.findOneAndUpdate({ _id : o_id}, { $set: query })
          .then(function(response){
            return sharingRules.changePrivacy(data);
          })
          .then(function(response){
            audits.putAuditInt(o_id,
            { orgOrigin: cid,
              auxConnection: {kind: 'item', item: o_id},
              user: userMail,
              eventType: 45,
              description: "From " + clasify(Number(data.oldAccessLevel)) + " to " + clasify(Number(data.accessLevel))
            });
          })
          .then(function(response){
            logger.debug("Item update process ended successfully...");
            logger.audit({user: userMail, action: 'itemUpdate', item: o_id });
            callback(false, response, true);
          })
          .catch(function(err){
            logger.error({user: userMail, action: 'itemUpdate', item: o_id, message: err});
            callback(true, err, false);
          });
        }
      });

    } else {

      if(data.hasOwnProperty('avatar')){ query = {avatar: data.avatar}; }
      itemOp.findOneAndUpdate({ _id : o_id}, { $set: query })
      .then(function(response){
        logger.debug("Item update process ended successfully...");
        logger.audit({user: userMail, action: 'itemUpdate', item: o_id });
        callback(false, response, true);
      })
      .catch(function(err){
        logger.error({user: userMail, action: 'itemUpdate', item: o_id, message: err});
        callback(true, err, false);
      });
    }
  } else {
    callback(false, 'User not authorized', false);
  }
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
function deviceActivityNotif(uid,oid,cid,state,typ){
  return notifHelper.createNotification(
    { kind: 'user', item: uid.id, extid: uid.extid },
    { kind: 'userAccount', item: cid.id, extid: cid.extid },
    { kind: 'item', item: oid.id, extid: oid.extid },
    'info', typ, null);
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

/*
Check if user can update a device based on its roles
*/
function checkUserAuth(roles, tokenUser, typeOfItem, itemUser){
  var imAdmin = roles.indexOf('administrator') !== -1;
  var canChangeSer, canChangeDev;
  if(tokenUser === itemUser){
    canChangeDev = (roles.indexOf('infrastructure operator') !== -1 && typeOfItem === 'device');
    canChangeSer = (roles.indexOf('service provider') !== -1 && typeOfItem === 'service');
  } else {
    canChangeDev = canChangeSer = false;
  }
  return imAdmin || canChangeSer || canChangeDev;
}

// Module exports

module.exports.enableItem = enableItem;
module.exports.disableItem = disableItem;
module.exports.updateItem = updateItem;
module.exports.updateManyItems = updateManyItems;
