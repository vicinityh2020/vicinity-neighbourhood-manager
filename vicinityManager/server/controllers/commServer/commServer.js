var logger = require("../../middlewares/logger");
var sRegistration = require("../../services/items/registration");
var sSearch = require("../../services/items/search");
var sDelItems = require("../../services/items/deleteItems");
var sDelNode = require('../../services/nodes/processNode');
var sGetNodeItems = require('../../services/nodes/get');

var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;

// Public functions

/*
Create items
*/
function registration(req, res){
  var data = req.body;
  sRegistration.create(data, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Search for items
input oids
output TDs
*/
function searchItems(req, res){
  var data = req.body;
  sSearch.searchItems(data, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Delete items
input oids
*/
function deleteItems(req, res){
  var data = req.body.oids;
  sDelItems.deleteItems(data)
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

/*
Enable items
Not accessible out of the webApp at the moment
*/
function enableItems(req, res){
  var data = req.body;
  res.json({error:false, message:"not implemented"});
}

/*
Disable items
Not accessible out of the webApp at the moment
*/
function disableItems(req, res){
  var data = req.body;
  res.json({error:false, message:"not implemented"});
}

/*
Update items
Delete & create
input idem as registration + oid
*/
function updateItems(req, res){
  var data = req.body;
  var adid = data.agid;
  var oids = [];
  for(var i = 0; i < data.thingDescriptions.length; i++){
    oids.push(data.thingDescriptions[i].oid);
    delete data.thingDescriptions[i].oid;
  }
  sDelItems.deleteItems(oids, "Agent:" + adid)
  .then(function(response){
    return sRegistration.create(data, function(err, response){
      res.json({error: err, message: response});
    });
  })
  .catch(function(err){res.json({"error": true, "message": err});});
}

/*
Get all items under Agent with TD
Retrieve last agent status
*/
function getAgentItems(req, res){
  var id = req.params.adid;
  sGetNodeItems.getNodeItems(id, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Delete agent
*/
function deleteAgent(req, res){
  var adid = req.params.adid;
  var adids = [];
  nodeOp.findOneAndUpdate({adid: adid}, {$set: {'status': 'deleted'}}, { new: true })
  .then(function(data){
      var cid = data.cid.id;
      return userAccountOp.update({_id: cid}, {$pull: {hasNodes: {extid: adid}} });
    })
  .then(function(response){
      adids.push(adid);
      return sDelNode.deleteNode(adids);
    })
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

// Export modules

module.exports.registration = registration;
module.exports.searchItems = searchItems;
module.exports.deleteItems = deleteItems;
module.exports.enableItems = enableItems;
module.exports.disableItems = disableItems;
module.exports.updateItems = updateItems;
module.exports.getAgentItems = getAgentItems;
module.exports.deleteAgent = deleteAgent;
