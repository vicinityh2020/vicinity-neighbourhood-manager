// Global Objects and variabled
var logger = require('../../middlewares/logger');
var nodeOp = require('../../models/vicinityManager').node;
var mongoose = require('mongoose');

// Return all items under an agent/node
function getOrgAgents(cid, api, callback){
  nodeOp.find({'cid.id': cid})
  .then(function(response){
    callback(false, response);
  })
  .catch(function(err){
    callback(true, err);
  });
}

// Return all items under an agent/node
function getNodeItems(adid, callback){
  var query = checkInput(adid);
  nodeOp.findOne(query, {adid:1, 'hasItems.id':1}).populate('hasItems.id', 'info')
  .then(function(response){
    var data = response.hasItems;
    callback(false, data);
  })
  .catch(function(err){
    callback(true, err);
  });
}

// Private functions
function checkInput(adid){
  try{
    var id = mongoose.Types.ObjectId(adid);
    return {_id: id};
  }
  catch(err){
    return {adid: adid};
  }
}


// Export Functions
module.exports.getOrgAgents = getOrgAgents;
module.exports.getNodeItems = getNodeItems;
