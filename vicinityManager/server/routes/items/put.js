// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var sharingRules = require('../../helpers/sharingRules');
var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var audits = require('../../routes/audit/put');
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
//TODO: Notify and audit when a device changes to disabled or private --> To orgs having access to it

  var response = {};
  var uid = mongoose.Types.ObjectId(req.params.id); // Unique mongo ID
  var updates = req.body;
  var oid = req.body.oid; // Object ID - Generated in VCNT manager
  var adid = req.body.adid; // Agent ID - Generated in VCNT manager
  var userId = mongoose.Types.ObjectId(req.body.userId);
  var userMail = req.body.userMail;
  delete updates.oid;
  delete updates.adid;
  delete updates.userId;
  delete updates.userMail;

  if(updates.status === 'enabled'){
    commServerProcess(oid, adid.extid, updates.name, oid, updates.cid.extid)
      .then(function(response){ return deviceActivityNotif(uid, updates.company_id, 'Enabled', 11);})
      .then(function(response){
        return audits.putAuditInt(
          uid,
          {
            orgOrigin: updates.company_id,
            user: userMail,
            auxConnection: {kind: 'item', item: uid},
            eventType: 43
          }
        );
      })
      .then(function(response){
        return audits.putAuditInt(
          updates.company_id,
          {
            orgOrigin: updates.company_id,
            user: userMail,
            auxConnection: {kind: 'item', item: uid},
            eventType: 43
          }
        );
      })
      .then(function(response){ return manageUserItems(oid, uid, userMail, userId, 'enabled'); })
      .then(function(response){ return itemUpdate(uid,updates); })
      .then(function(response){
        logger.audit({user: userMail, action: 'EnableItem', item: uid });
        res.json({"response":response}); })
      .catch(function(err){
        logger.error({user: userMail, action: 'EnableItem', item: uid, message: err});
        res.json({"response" : err});}
      );

  }else if(updates.status === 'disabled'){
    commServer.callCommServer({}, 'users/' + oid , 'DELETE')
      .then(function(response){ return deviceActivityNotif(uid, updates.company_id, 'Disabled', 12);})
      .then(function(response){
        return audits.putAuditInt(
          uid,
          {
            orgOrigin: updates.company_id,
            user: userMail,
            auxConnection: {kind: 'item', item: uid},
            eventType: 44
          }
        );
      })
      .then(function(response){
        return audits.putAuditInt(
          updates.company_id,
          {
            orgOrigin: updates.company_id,
            user: userMail,
            auxConnection: {kind: 'item', item: uid},
            eventType: 44
          }
        );
      })
      .then(function(response){ return manageUserItems(oid, uid, userMail, userId, 'disabled'); })
      .then(function(response){ return itemUpdate(uid,updates);})
      .then(function(response){
        logger.audit({user: userMail, action: 'DisableItem', item: uid });
        res.json({"response":response}); })
      .catch(function(err){
        logger.error({user: userMail, action: 'DisableItem', item: uid, message: err});
        res.json({"response" : err});}
      );
  }else{
    audits.putAuditInt(
      uid,
      {
        orgOrigin: updates.company_id,
        auxConnection: {kind: 'item', item: uid},
        user: userMail,
        eventType: 45,
        description: "From " + clasify(Number(updates.oldAccessLevel)) + " to " + clasify(Number(updates.accessLevel))
      }
    )
    .then(function(response){ itemUpdate(uid,updates); })
    .then(function(response){
      logger.audit({user: userMail, action: 'itemUpdate', item: uid });
      res.json({"response":response}); })
    .catch(function(err){
      logger.error({user: userMail, action: 'itemUpdate', item: uid, message: err});
      res.json({"response" : err});}
    );

  }
}

/*
Handles the accessLevel and other properties modifications
*/
function itemUpdate(uid,updates){
  return new Promise(
    function(resolve, reject) {
      if(updates.accessLevel == null){
        if(!updates.status){
          query = { accessLevel: updates.accessLevel };
          logger.debug("Start update of accessLevel...");
        } else {
          query = {status: updates.status, accessLevel: updates.accessLevel};
          logger.debug("Start update of accessLevel and item activation/deactivation...");
        }
        itemOp.findOneAndUpdate({ _id : uid}, {$set: query }, function(err, raw){
          sharingRules.changePrivacy(updates);
          resolve({"error": err, "message": raw});
          logger.debug("Item update process ended successfully...");
          }
        );
      } else {
        itemOp.findOneAndUpdate({ _id : uid}, { $set: updates }, function(err, raw){
          resolve({"error": err, "message": raw});
          }
        );
      }
    }
  );
}

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

module.exports.putOne = putOne;
