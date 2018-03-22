// Global objects and variables
var logger = require('../../middlewares/logger');
var auditOp = require('../../models/vicinityManager').auditLog;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemOp = require('../../models/vicinityManager').item;
var uuid = require('uuid'); // Unique ID RFC4122 generator

// Public functions

function get(id, c_id, type, searchDate, callback){

  if(type === 'user'){
    dbOp = userOp;
  } else if(type === 'userAccount') {
    dbOp = userAccountOp;
  } else {
    dbOp = itemOp;
  }

  dbOp.findOne({_id: id}, {hasAudits:1, cid:1})
  .populate({
    path: 'hasAudits',
    match: { $gt: searchDate },
    populate: [
      { path:'actor.id', select: 'name email'},
      { path:'target.item', select: '-avatar'},
      { path:'object.item', select: '-avatar'}
    ]
    // select: '-_id'
  })
  .then(function(audits){
    // Check if the data belong to my company and I can see it
    if(audits._id.toString() === c_id.toString() || audits.cid.id.toString() === c_id.toString()){
      callback(false, audits, true);
    } else {
      callback(false, 'Unauthorized', false);
    }
  })
  .catch(function(error){
    callback(true, error, false);
  });
}

function create(actor, target, object, type, description){
  return new Promise(function(resolve, reject) {
    var audit = new auditOp();
    audit.actor = actor;
    audit.target = target;
    audit.object = object;
    audit.type = type;
    audit.description = message;
    audit.audid = uuid();
    audit.save(function(err, response){
      if(err){
        reject(err);
      } else {
        if(target.kind === 'user'){
          userOp.update({_id: target.item}, {$push: {hasAudits: {id: response._id, extid: response.audid}}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        } else if(target.kind === 'item'){
          itemOp.update({_id: target.item}, {$push: {hasAudits:{id: response._id, extid: response.audid}}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        } else {
          userAccountOp.update({_id: target.item}, {$push: {hasAudits: {id: response._id, extid: response.audid}}}, function(err, response){
            if(err){ reject(err); } else { resolve(true); }
          });
        }
      }
    });
  });
}

module.exports.create = create;
module.exports.get = get;
