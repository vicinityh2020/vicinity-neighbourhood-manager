var logger = require("../../middlewares/logger");
var sRegistration = require("../../services/items/registration");
var sSearch = require("../../services/items/search");
var sDelItems = require("../../services/items/deleteItems");
var sDelNode = require('../../services/nodes/processNode');
var sGetNodeItems = require('../../services/nodes/get');

var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;

// Public functions

/**
 * Create items
 *
 * @param {Object} data
 * adid (string), TDs (array of objects) without OID
 * @return {Array}
 * array of {oid, infra-id, password, id}
 */
function registration(req, res){
  logger.debug('You are REGISTERING...');
  var data = req.body;
  sRegistration.create(data, function(err, response){
    res.json({error: err, message: response});
  });
}


/**
 * Search for items
 *
 * @param {Array} oids
 *
 * @return {Array} TDs
 *
 */
function searchItems(req, res){
  var data = req.body;
  sSearch.searchItems(data, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Delete items
 *
 * @param {Array} oids
 * @param {String} agid
 * @return {String} success/error
 *
 */
function deleteItems(req, res){
  logger.debug('You are DELETING...');
  var adid = req.body.agid || req.body.adid;
  var data = req.body.oids;
  nodeOp.findOne({adid:adid},{hasItems:1}) // Check if oids belong under agent
  .then(function(response){
    var toRemove = [];
    for(var i = 0; i < data.length; i++){
      for(var j = 0; j < response.hasItems.length; j++){
        if(data[i] === response.hasItems[j].extid){
          toRemove.push(data[i]);
        }
      }
    }
    return sDelItems.deleteItems(toRemove, "Agent:" + adid); // TODO send toRemove
  })
  .then(function(response){ res.json({"error": false, "message": response});})
  .catch(function(err){ res.json({"error": true, "message": err});});
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

 /**
 *  Update items
 *  Delete & create
 *  input idem as registration + oid
 *
 * @param {Object} data
 * adid (string), TDs (array of objects) with OID
 * @return {Array}
 * array of {oid, infra-id, password, id}
 */
function updateItems(req, res){
  logger.debug('You are UPDATING...');
  var rawData = req.body;
  var adid = req.body.agid || req.body.adid;
  var data = {
              thingDescriptions: [],
              adid: adid
            };
  nodeOp.findOne({adid:adid},{hasItems:1}) // Check if oids belong under agent
  .then(function(response){
    var toRemove = [];
    for(var i = 0; i < rawData.thingDescriptions.length; i++){
      for(var j = 0; j < response.hasItems.length; j++){
        if(rawData.thingDescriptions[i].oid === response.hasItems[j].extid){
          toRemove.push(rawData.thingDescriptions[i].oid);
          delete rawData.thingDescriptions[i].oid;
          data.thingDescriptions.push(rawData.thingDescriptions[i]);
        }
      }
    }
    return sDelItems.deleteItems(toRemove, "Agent:" + adid);
  })
  .then(function(response){
    return sRegistration.create(data, function(err, response){
      res.json({error: err, message: response});
    });
  })
  .catch(function(err){res.json({"error": true, "message": err});});
}

/**
* Get all items under Agent with TD
* Retrieve last agent status
* @param {String} agid
* adid (string), TDs (array of objects) without OID
* @return {Array}
* array of {TDs
*/
function getAgentItems(req, res){
  logger.debug('You are getting the CONFIG...');
  var id = req.params.agid;
  sGetNodeItems.getNodeItems(id, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Delete agent
*/
function deleteAgent(req, res){
  var adid = req.params.agid;
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
