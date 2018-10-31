var logger = require("../../middlewares/logBuilder");
var sRegistration = require("../../services/items/registration");
var sSearch = require("../../services/items/search");
var sDelItems = require("../../services/items/deleteItems");
var sUpdItems = require("../../services/items/updThingDescription");
var sDelNode = require('../../services/nodes/processNode');
var sGetNodeItems = require('../../services/nodes/get');
var commServer = require('../../services/commServer/request');

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
  logger.log(req, res, {type: 'debug', data: 'You are REGISTERING...'});
  if(!req.body.thingDescriptions){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing data"});
    res.json({error: false, message: "Data is missing..."});
  } else {
    sRegistration.create(req, res, function(err, response, success){
      res.json({error: err, message: response});
    });
  }
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
  logger.log(req, res, {type: 'debug', data: 'You are DELETING...'});
  var adid = req.body.agid || req.body.adid;
  if(!adid){
    res.status(400);
    res.json({error: false, message: "Agent id missing..."});
  } else {
    var data = req.body.oids;
    nodeOp.findOne({adid:adid},{hasItems:1, type:1}) // Check if oids belong under agent
    .then(function(response){
      var toRemove = [];
      for(var i = 0; i < data.length; i++){
        for(var j = 0; j < response.hasItems.length; j++){
          if(data[i] === response.hasItems[j].extid){
            toRemove.push(data[i]);
          }
        }
      }
      req.body = {};
      req.body.decoded_token = {sub: "Agent:" + adid};
      return sDelItems.deleteItems(toRemove, req, res, response.type[0]);
    })
    .then(function(response){
      var errors = false;
      for(var i = 0, l = response.message.length; i < l; i++){
        if(response.message[i].error) errors = true;
      }
      if(errors){
        res.json({"error": true, "message": response});
      } else {
        res.json({"error": false, "message": response});
      }
    })
    .catch(function(err){ res.json({"error": true, "message": err});});
  }
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
 *  Modify contents of item
 *  input idem as registration + oid
 *
 * @param {Object} data
 * adid (string), TDs (array of objects) with OID
 * @return {Array}
 * array of {oid, infra-id, password, id}
 */
function updateItem(req, res){
  logger.log(req, res, {type: 'debug', data: 'You are UPDATING...'});
  var rawData = req.body;
  var adid = req.body.agid || req.body.adid;
  if(!adid){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing agid"});
    res.json({error: false, message: "Agent id missing..."});
  } else if(!rawData.thingDescriptions){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing data"});
    res.json({error: false, message: "Data is missing..."});
  } else {
    var data = {
                thingDescriptions: [],
                adid: adid
              };
    nodeOp.findOne({adid:adid},{hasItems:1}) // Check if oids belong under agent
    .then(function(response){
      for(var i = 0; i < rawData.thingDescriptions.length; i++){
        for(var j = 0; j < response.hasItems.length; j++){
          if(rawData.thingDescriptions[i].oid === response.hasItems[j].extid){
            data.thingDescriptions.push(rawData.thingDescriptions[i]);
          }
        }
      }
      if(data.thingDescriptions.length === 0){
        res.status(400);
        res.json({error: false, message: "Nothing to register or none of the items belong to the agent that is updating..."});
      } else {
        return sRegistration.update(data, req, res, function(err, response, log){
          res.json({error: err, message: response});
        });
      }
    })
    .catch(function(err){
      res.json({"error": true, "message": err});
    });
  }
}

 /**
 *  Update item contents
 *  Update info field
 *  input idem as registration + oid
 *
 * @param {Object} data
 * adid (string), TDs (array of objects) with OID
 * @return {Array}
 * array of {oid, infra-id, success, error}
 */
function updateItemContent(req,res){
  logger.log(req, res, {type: 'debug', data: 'You are UPDATING content...'});
  var rawData = req.body;
  var adid = typeof req.body.adid !== 'undefined' ? req.body.adid : req.body.agid;
  var toUpdate = [];
  if(!adid){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: "Missing agid"});
    res.json({error: false, message: "Missing adapter identificator (adid/agid)"});
  } else if(!rawData.thingDescriptions){
      res.status(400);
      logger.log(req, res, {type: 'warn', data: "Missing data"});
      res.json({error: false, message: "Data is missing..."});
  } else {
    nodeOp.findOne({adid:adid},{hasItems:1}) // Check if oids belong under agent
    .then(function(response){
      for(var i = 0; i < rawData.thingDescriptions.length; i++){
        for(var j = 0; j < response.hasItems.length; j++){
          if(rawData.thingDescriptions[i].oid === response.hasItems[j].extid){
            toUpdate.push(rawData.thingDescriptions[i]);
          }
        }
      }
      if(toUpdate.length === 0){
        res.status(400);
        res.json({error: false, message: "Nothing to register or none of the items belong to the agent that is updating..."});
      } else {
        return sUpdItems.updateContents(toUpdate);
      }
    })
    .then(function(response){
      logger.log(req, res, {type: 'audit', data: response});
      res.json({error: false, message: response});
    })
    .catch(function(err){
      logger.log(req, res, {type: 'error', data: err});
      res.json({error: true, message: err});
    });
  }
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
  logger.log(req, res, {type: 'debug', data: 'You are getting the CONFIG...'});
  var id = req.params.agid;
  sGetNodeItems.getNodeItems(id, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Delete agent
*/
function deleteAgent(req, res){
  var adid = req.params.agid;
  var adids = [];
  req.body = {};
  req.body.decoded_token = {sub: null, uid: null};
  nodeOp.findOneAndUpdate({adid: adid}, {$set: {'status': 'deleted'}}, { new: true })
  .then(function(data){
      var cid = data.cid.id;
      return userAccountOp.update({_id: cid}, {$pull: {hasNodes: {extid: adid}} });
    })
  .then(function(response){
      adids.push(adid);
      return sDelNode.deleteNode(adids, req, res);
    })
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

/*
Get object neighbourhood
*/
function neighbourhood(req, res){
  var oid = req.params.oid;
  commServer.callCommServer({}, 'users/' + oid + '/roster', 'GET')
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

// Export modules

module.exports.registration = registration;
module.exports.searchItems = searchItems;
module.exports.deleteItems = deleteItems;
module.exports.enableItems = enableItems;
module.exports.disableItems = disableItems;
module.exports.updateItemContent = updateItemContent;
module.exports.updateItem = updateItem;
module.exports.getAgentItems = getAgentItems;
module.exports.deleteAgent = deleteAgent;
module.exports.neighbourhood = neighbourhood;
