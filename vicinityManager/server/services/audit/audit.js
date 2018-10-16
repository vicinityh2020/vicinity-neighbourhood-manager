// Global objects and variables
var mongoose = require('mongoose');
var auditOp = require('../../models/vicinityManager').auditLog;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemOp = require('../../models/vicinityManager').item;
var logger = require('../../middlewares/logBuilder');
var auditHelper = require('../../services/audit/audit');
var uuid = require('uuid'); // Unique ID RFC4122 generator

// Public functions

/**
* Gets audits
* @param {String} id - User, org or item id
* @param {String} c_id - My organisation id
* @param {String} type - User, org or item
* @param {MongoId} searchDate - To get only over
* @param {String} id - User, org or item id
* @return {Array} Audits
*/

function get(req, res, callback){
  var c_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var id = mongoose.Types.ObjectId(req.params.id);
  var type = req.query.hasOwnProperty('type') && req.query.type !== 'undefined' ? req.query.type : false; // user, userAccount, item
  var searchDate = req.query.hasOwnProperty('searchDate') && req.query.searchDate !== 'undefined' ?
                  auditHelper.objectIdWithTimestamp(req.query.searchDate):
                  auditHelper.objectIdWithTimestamp(moment().subtract(7, 'days').valueOf());
var dbOp;
  if(type === 'user'){
    dbOp = userOp;
  } else if(type === 'userAccount') {
    dbOp = userAccountOp;
  } else {
    dbOp = itemOp;
  }

// TODO avoid sending members of hasAudits which do not meet match condition
// Right now are being sent as hasAudits.id = null
  dbOp.findOne({_id: id}, {hasAudits:1, cid:1})
  .populate({
    path: 'hasAudits.id',
    match: { _id: { $gt: searchDate } },
    populate: [
      { path:'actor.item', select: 'name email oid cid'},
      { path:'target.item', select: 'name email oid cid'},
      { path:'object.item', select: 'name email oid cid'}
    ]
    // select: '-_id'
  })
  .then(function(audits){
    // Check if the data belong to my company and I can see it
    if(audits._id.toString() === c_id.toString() || audits.cid.id.toString() === c_id.toString()){
      callback(false, audits, true);
    } else {
      logger.log(req, res,  { data: 'Unauthorized', type: "warn"});
      callback(false, 'Unauthorized', false);
    }
  })
  .catch(function(error){
    callback(true, error, false);
  });
}

/**
* Post an audit
* @param {Object} actor
* @param {Object} target
* @param {Object} object
* @param {String} type
* @param {String} description
* @return {Promise}
*/

function create(actor, target, object, type, description){
  return new Promise(function(resolve, reject) {
    var audit = new auditOp();
    audit.actor = actor;
    audit.target = target;
    audit.object = object;
    audit.type = type;
    audit.description = description;
    audit.audid = uuid();
    audit.save(function(err, response){
      var aux = response;
      if(err){
        reject(err);
      } else {
        addToEntity(actor, aux._id, aux.audid)
        .then(function(response){
          if(target.item !== 'undefined'){
            return addToEntity(target, aux._id, aux.audid);
          } else { return true; }
        })
        .then(function(response){
          if(object.item !== 'undefined' && object.extid !== actor.extid){
            return addToEntity(object, aux._id, aux.audid);
          } else { return true; }
        })
        .then(function(response){ resolve(true); })
        .catch(function(err){ reject(err); });
      }
    });
  });
}

/*
Private functions
*/

// Converts mongo ID to timestamp
function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
    return constructedObjectId;
}

function addToEntity(entity, id, audid){
  return new Promise(function(resolve, reject) {
    if(entity.kind === 'user'){
      userOp.update({_id: entity.item}, {$push: {hasAudits: {id: id, extid: audid}}}, function(err, response){
        if(err){ reject(err); } else { resolve(true); }
      });
    } else if(entity.kind === 'item'){
      itemOp.update({_id: entity.item}, {$push: {hasAudits:{id: id, extid: audid}}}, function(err, response){
        if(err){ reject(err); } else { resolve(true); }
      });
    } else if(entity.kind === 'userAccount'){
      userAccountOp.update({_id: entity.item}, {$push: {hasAudits: {id: id, extid: audid}}}, function(err, response){
        if(err){ reject(err); } else { resolve(true); }
      });
    } else {
      resolve(false);
    }
  });
}

// Export modules

module.exports.create = create;
module.exports.get = get;
module.exports.objectIdWithTimestamp = objectIdWithTimestamp;
