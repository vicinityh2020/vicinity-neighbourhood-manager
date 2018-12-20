
// Global Objects

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var userOp = require('../../models/vicinityManager').user;
var logger = require('../../middlewares/logBuilder');
var logger2 = require('../../middlewares/logger');
var commServer = require('../../services/commServer/request');
var semanticRepo = require('../../services/semanticRepo/request');
var sync = require('../../services/asyncHandler/sync');
var sharingRules = require('../../services/sharingRules');
var audits = require('../../services/audit/audit');

// Public functions

/*
Deletes either a selection of oids or all oids under a node
*/
function deleteItems(oids, req, res, typeAgent){
  var email = req.body.decoded_token.sub;

  //Synchronous removal if also involved semantic repo (VCNT)
  var syncDelete = typeAgent === "generic.adapter.vicinity.eu" || typeAgent === "vcnt";

  return new Promise(function(resolve, reject) {
    if(oids.length > 0){ // Check if there is any item to delete
      sync.forEachAll(oids,
        function(value, allresult, next, otherParams) {
          deleting(value, otherParams, function(value, result, error) {
              allresult.push({value: value, result: result, error: error});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === oids.length){
            resolve({"error": false, "message": allresult });
          }
        },
        // If true -> sync requests
        syncDelete,
        { req: req,
          res: res,
          typeAgent: typeAgent,
          userMail: email
        }
      );
    } else {
      logger.log(req, res, {type: "warn", data: {user:email, action: 'deleteItem', message: "No items to be removed"}});
      resolve({"error": false, "message": "Nothing to be removed..."});
    }
  });
}

// Private functions

/*
Delete == Remove relevant fields and change status to removed
Make sure that agent is deleted or break connection with removed object
*/
function deleting(oid, otherParams, callback){
  var req =  otherParams.req;
  var res = otherParams.res;
  var userMail = otherParams.userMail;
  var obj = {
    info: {},
    avatar: "",
    accessLevel: 0,
    status: 'deleted',
    cid: [],
    adid: [],
    hasContracts: []
  };
  itemOp.findOne({oid:oid}, {avatar:0},
    function(err,data){
      if(err){
        logger.log(req, res, {type: 'error', data: err});
        callback(oid, "error mongo" + err, true);
      }else if(!data){
        logger.log(req, res, {type: 'warn', data: "Object does not exist"});
        callback(oid, "Object does not exist", false);
      }else{
        var cid = data.cid;
        var id = data._id;
        var hasUser = (data.status === 'enabled');
        var contracts = [];
        getOnlyCtid(contracts, data.hasContracts);
        var owner = {};

        itemOp.update({oid:oid}, {$set: obj})
        .then(function(response){
          if(hasUser && contracts.length > 0){ // If the item does not have owner, cannot have contracts either
             return sharingRules.removeOneItem(oid, data.uid.id, contracts, otherParams);
           } else {
             return false;
           }
        })
        .then(function(response){ return nodeOp.update({_id: data.adid.id}, {$pull: {hasItems: { extid : oid }}}); })
        .then(function(response){
          if(hasUser){
            owner.id = data.uid.id; owner.extid = data.uid.extid; owner.entity = 'user';
            return userOp.update({_id: data.uid.id}, {$pull: {hasItems: { extid : oid }}});
          } else {
            owner.id = data.adid.id; owner.extid = data.adid.extid; owner.entity = 'node';
            return false;
          }
        })
        .then(function(response){
          if(otherParams.typeAgent !== "generic.adapter.sharq.eu" && otherParams.typeAgent !== "shq"){
            return semanticRepo.callSemanticRepo({}, "td/remove/" + oid, 'DELETE');
          } else {
            return false;
          }
        })
        .then(function(response){ return commServer.callCommServer({}, 'users/' + oid, 'DELETE'); })
        .then(function(response){
          return audits.create(
            { kind: owner.entity, item: owner.id, extid: owner.extid },
            { kind: 'userAccount', item: data.cid.id, extid: data.cid.extid },
            { kind: 'item', item: data._id, extid: data.oid, name: data.name },
            42, null);
        })
        .then(function(ans){
          logger.log(req, res, {type: 'audit', data: {user: userMail, action: 'deleteItem', item: oid }});
          callback(oid, "Success", false);})
        .catch(function(err){
          if(err.statusCode === 404){
            logger.log(req, res, {type: 'warn', data: {user: userMail, action: 'deleteItem', item: oid, message: 'Object did not exist in comm server' }});
            callback(oid, "Success", false);
          } else if(err.name === "RequestError"){
            logger.log(req, res, {type: 'error', data: {user: userMail, action: 'deleteItem', item: oid, message: err.name + " " + err.cause.code }});
            callback(oid, 'Request timeout', true);
          } else if(err.name === "MongoError"){
            logger.log(req, res, {type: 'error', data: {user: userMail, action: 'deleteItem', item: oid, message: err}});
            callback(oid, 'Mongo Error', true);
          } else {
            logger.log(req, res, {type: 'error', data: {user: userMail, action: 'deleteItem', item: oid, message: err}});
            callback(oid, 'Server error', true);
          }
        });
      }
    });
  }

  /*
  Creates array with ids
  */
  function getOnlyCtid(array, toAdd){
    for(var i = 0, l = toAdd.length; i < l; i++){
      array.push(toAdd[i].extid);
    }
  }

// Export modules

module.exports.deleteItems = deleteItems;
