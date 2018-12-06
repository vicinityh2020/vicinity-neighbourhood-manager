// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var commServer = require('../../services/commServer/request');
var sharingRules = require('../../services/sharingRules');
var audits = require('../../services/audit/audit');
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
function updateManyItems(req, res, callback){
  var items = req.body.items;
  if(items.length !== 0){ // Check if there is any item to update
    sync.forEachAll(items,
    function(value, allresult, next, otherParams) {
      value.multi = true;
        if(value.status === 'enabled'){
          enableItem(req, res, function(value, error, success, message) {
            allresult.push({value: value, error: error, success: success, message: message});
            next();
          }, value);
        }else if(value.status === 'disabled'){
          disableItem(req, res, function(value, error, success, message) {
            allresult.push({value: value, error: error, success: success, message: message});
            next();
          }, value);
        } else {
          updateItem(req, res, function(value, error, success, message) {
            allresult.push({value: value, error: error, success: success, message: message});
            next();
          }, value);
        }
      },
      function(allresult) {
        if(allresult.length === items.length){
          logger.log(req, res, {type: 'audit', data: allresult});
          callback(false, true, allresult);
        }
      },
      false,
      {}
    );
  } else {
    logger.log(req, res, {type: 'debug', data:'No items to modify'});
    callback(false, false, 'No items to modify');
  }
}

/*
Enable items
*/
function enableItem(req, res, callback, other){
  var data = req.body;
  if(other && other.multi) data = other;
  var cid = req.body.decoded_token.cid;
  var c_id = req.body.decoded_token.orgid;
  var userMail = req.body.decoded_token.sub;
  var userId = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var roles = req.body.decoded_token.roles;
  var oid;
  var o_id;
  var idQuery = checkId(data.o_id);
  var query = {};

  // Previous accessLevel always 0 -- Private (Disabled)
  data.accessLevel = 0;

  itemOp.findOne(idQuery, {cid:1, oid:1}, function(err, response){ // Get item creds to avoid forging
    oid = response.oid;
    o_id = response._id;
    data.cid = response.cid.extid;
    oid = response.oid;
    var canChange = checkUserAuth(roles, userMail, cid, data.typeOfItem, userMail, data.cid, false); // There is no uid when enabling
    if(canChange.error){
      logger.log(req, res, {type: 'error', data: canChange.continue});
      callback(o_id, true, false, canChange.continue);
    }
    if(canChange.continue){
      commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'POST')
      .then(function(response){ return manageUserItems(oid, o_id, userMail, userId, 'enabled'); })
      .then(function(response){
         var query = {status: data.status, accessLevel: data.accessLevel};
         return itemOp.findOneAndUpdate({ _id : o_id}, {$set: query});
       })
      .then(function(response){
        return deviceActivityNotif(
          {id: userId, extid: userMail},
          {id: o_id, extid: oid},
          {extid: cid, id: c_id},
          'Enabled', 11);
      })
      .then(function(response){
        return audits.create(
          { kind: 'user', item: userId, extid: userMail },
          { kind: 'item', item: o_id, extid: oid },
          { },
          43, null);
      })
      .then(function(response){
        logger.log(req, res, {type: 'audit', data:{user: userMail, action: 'EnableItem', item: o_id }});
        callback(o_id, false, true, 'enabled');
      })
      .catch(function(err){
        logger.log(req, res, {type: 'error', data: err});
        callback(o_id, true, false, err);
      });
    } else {
      logger.log(req, res, {type: 'warn', data: 'User not authorized'});
      callback(o_id, false, false, 'User not authorized');
    }
  });
}

/*
Disable items
*/
function disableItem(req, res, callback, other){
  var data = req.body;
  if(other && other.multi) data = other;
  var cid = req.body.decoded_token.cid;
  var c_id = req.body.decoded_token.orgid;
  var userMail = req.body.decoded_token.sub;
  // var userId = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var userId;
  var roles = req.body.decoded_token.roles;
  var oid;
  var o_id;
  var idQuery = checkId(data.o_id);
  var query = {};

  // Previous accessLevel always 0 -- Private (Disabled)
  data.accessLevel = 0;

  itemOp.findOne(idQuery, {cid:1, uid:1, oid:1}, function(err, response){ // Get item creds to avoid forging
    data.uid = response.uid.extid;
    userId = response.uid.id;
    oid = response.oid;
    o_id = response._id;
    data.cid = response.cid.extid;
    var canChange = checkUserAuth(roles, userMail, cid, data.typeOfItem, data.uid, data.cid, true);
    if(canChange.error){
      logger.log(req, res, {type: 'error', data: canChange.continue});
      callback(o_id, true, false, canChange.continue);
    }
    if(canChange.continue){
      commServer.callCommServer({}, 'users/' + oid + '/groups/' + cid + '_ownDevices', 'DELETE')
      .then(function(response){ return manageUserItems(oid, o_id, userMail, userId, 'disabled'); })
      .then(function(response){
         var query = {status: data.status, accessLevel: data.accessLevel};
         return itemOp.update({ _id : o_id}, {$set: query});
       })
      .then(function(response){
        var ids = [];
        ids.push(o_id);
        return sharingRules.changePrivacy(ids, userId, userMail, c_id);
        })
      .then(function(response){
        return deviceActivityNotif(
          {id: userId, extid: data.cid},
          {id: o_id, extid: oid},
          {extid: cid, id: c_id},
          'Disabled', 12);
        })
      .then(function(response){
        return audits.create(
          { kind: 'user', item: userId, extid: data.cid },
          { kind: 'item', item: o_id, extid: oid },
          { },
          44, null);
        })
        .then(function(response){
          logger.log(req, res, {type: 'audit', data:{user: userMail, action: 'DisableItem', item: o_id }});
          callback(o_id, false, true, 'disabled');
        })
      .catch(function(err){
        logger.log(req, res, {type: 'error', data: err});
        callback(o_id, true, false, err);
      });
    } else {
      logger.log(req, res, {type: 'warn', data: 'User not authorized'});
      callback(o_id, false, false, 'User not authorized');
    }
  });
}

/*
Update items
*/
function updateItem(req, res, callback, other){
  var data = req.body;
  if(other && other.multi) data = other;
  var cid = req.body.decoded_token.cid;
  var c_id = req.body.decoded_token.orgid;
  var userMail = req.body.decoded_token.sub;
  var userId = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var roles = req.body.decoded_token.roles;
  var oid;
  var o_id;
  var idQuery = checkId(data.o_id);
  var query = {};
  var oldAccessLevel;

  itemOp.findOne(idQuery, {cid:1, uid:1, oid:1, status:1}, function(err, response){ // Get item creds to avoid forging
    var status = response.status;
    if(status === 'enabled') data.uid = response.uid.extid;
    data.cid = response.cid.extid;
    oid = response.oid;
    o_id = response._id;
    var canChange = checkUserAuth(roles, userMail, cid, data.typeOfItem, data.uid, data.cid, false);
    if(canChange.error){
      logger.log(req, res, {type: 'error', data: canChange.continue});
      callback(o_id, true, false, canChange.continue);
    }

    if(status !== 'enabled'){
      logger.log(req, res, {type: 'warn', data: 'Item needs to be enabled to change accessLevel'});
      callback(o_id, false, false, 'Item needs to be enabled to change accessLevel');
    } else if(canChange.continue){
      if(data.hasOwnProperty('accessLevel')){
        userOp.findOne({_id:userId}, {accessLevel:1}, function(err, response){
          if(err){
            logger.log(req, res, {type: 'error', data: err});
            callback(o_id, true, false, err);
          } else if(Number(response.accessLevel) < Number(data.accessLevel)){
            logger.log(req, res, {type: 'warn', data:"User privacy is too low..."});
            callback(o_id, false, false, "User privacy is too low...");
          } else {
            query = {accessLevel: data.accessLevel};
            itemOp.findOneAndUpdate({ _id : o_id}, { $set: query }) // returns new document defaults = false
            .then(function(response){
              oldAccessLevel = response.accessLevel;
              if(oldAccessLevel > data.accessLevel){
                var ids = [];
                ids.push(o_id);
                return sharingRules.changePrivacy(ids, userId, userMail, c_id);
              } else {
                return false;
              }
            })
            .then(function(response){
              return audits.create(
                { kind: 'user', item: userId, extid: userMail },
                { kind: 'item', item: o_id, extid: oid },
                { },
                45,
                "From " + clasify(oldAccessLevel) + " to " + clasify(Number(data.accessLevel))
              );
            })
            .then(function(response){
              logger.log(req, res, {type: 'audit', data:{user: userMail, action: 'itemUpdate', item: o_id }});
              callback(o_id, false, true, 'accessLevel updated');
            })
            .catch(function(err){
              logger.log(req, res, {type: 'error', data: err});
              callback(o_id, true, false, err);
            });
          }
        });

      } else {

        if(data.hasOwnProperty('avatar')){ query = {avatar: data.avatar}; }
        itemOp.findOneAndUpdate({ _id : o_id}, { $set: query })
        .then(function(response){
          logger.log(req, res, {type: 'audit', data:{user: userMail, action: 'itemUpdate', item: o_id }});
          callback(o_id, false, true, 'avatar updated');
        })
        .catch(function(err){
          logger.log(req, res, {user: userMail, action: 'itemUpdate', item: o_id, message: err});
          logger.log(req, res, {type: 'error', data: err});
          callback(o_id, true, false, err);
        });
      }
    } else {
      logger.log(req, res, {type: 'warn', data: 'User not authorized'});
      callback(o_id, false, false, 'User not authorized');
    }
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
  var query = type === 'enabled' ?
  userOp.update({'email': email}, {$push: {hasItems: item}})
  .then(function(response){
    return itemOp.update({_id:uid}, {$set: {uid: user }});
  }) :
  userOp.update({_id: userId}, {$pull: {hasItems: item}})
  .then(function(response){
    return itemOp.update({_id:uid}, {$set: {uid: user }}); });
  return query;
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
Check if user can update a device based on its roles and cid
*/
function checkUserAuth(roles, tokenUser, tokenCid, typeOfItem, itemUser, itemCid, imDisabling){
  try{
    var imAdmin = (roles.indexOf('administrator')) !== -1 && (tokenCid === itemCid) && (imDisabling); // myOwn company admin
    var canChangeSer, canChangeDev;
    if((tokenUser === itemUser) && (tokenCid === itemCid)){
      canChangeDev = (roles.indexOf('device owner') !== -1 && typeOfItem === 'device');
      canChangeSer = (roles.indexOf('service provider') !== -1 && typeOfItem === 'service');
    } else {
      canChangeDev = canChangeSer = false;
    }
    return {error: false, continue: imAdmin || canChangeSer || canChangeDev};
  }catch(err){
    return {error: true, continue: err};
  }
}

/*
Check if primary id or external id
*/
function checkId(id){
  var adid;
  try{
    adid = mongoose.Types.ObjectId(id);
    return {_id: adid};
  } catch(err) {
    return {oid: id};
  }
}

// Module exports

module.exports.enableItem = enableItem;
module.exports.disableItem = disableItem;
module.exports.updateItem = updateItem;
module.exports.updateManyItems = updateManyItems;
