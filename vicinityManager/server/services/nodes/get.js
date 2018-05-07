// Global Objects and variabled
var logger = require('../../middlewares/logger');
var nodeOp = require('../../models/vicinityManager').node;

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
  nodeOp.findOne({adid: adid},{adid:1, 'hasItems.id':1}).populate('hasItems.id', 'info -_id')
  .then(function(response){
    var data = response.hasItems;
    callback(false, data);
  })
  .catch(function(err){
    callback(true, err);
  });
}

// Export Functions
module.exports.getOrgAgents = getOrgAgents;
module.exports.getNodeItems = getNodeItems;
