// Global Objects

var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var regisHelper = require('../../services/items/registrationHelper');
var logger = require('../../middlewares/logBuilder');
var config = require('../../configuration/configuration');
var sync = require('../../services/asyncHandler/sync');

// Public Function -- Main

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function create(req, res, callback){
  var objectsArray = req.body.thingDescriptions;
  var adid = typeof req.body.adid !== 'undefined' ? req.body.adid : req.body.agid;

  nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1, type:1},
    function(err,data){
        if(err){
          res.status(500);
          logger.log(req, res, {type: 'error', data: err});
          callback(true, "Error in Mongo", false);
        }else if(!data){
          res.status(400);
          logger.log(req, res, {type: 'warn', data: "Invalid adid/agid identificator"});
          callback(true, "Invalid adid/agid identificator", false);
        } else {
          var nodeId = data._id;
          var nodeName = data.name;
          var myNode = {adid: adid, name: nodeName, id: nodeId};
          var cid = data.cid;
          var doSemanticValidation = config.enabledAdapters.indexOf(data.type[0]) !== -1; // Check if agent type allows semantic validation
          var adapterType = data.type[0] === "generic.adapter.sharq.eu" ? "shq" : "vcnt"; // TODO cover more types when needed
          var semanticTypes = {};

          // Get available item types in the semantic repository or static file
          regisHelper.getTypes(doSemanticValidation)
          .then(function(response){
            semanticTypes.services = response.services;
            semanticTypes.devices = response.devices;

            // Process new items internally
            sync.forEachAll(objectsArray,
              function(value, allresult, next, otherParams) {
                regisHelper.saveDocuments(value, otherParams, function(value, result) {
                    allresult.push({data: value, result: result});
                    next();
                });
              },
              function(allresult) {
                // Final part: Return results, update node and notify
                if(allresult.length === objectsArray.length){ // Only process final step if all the stack of tasks completed
                  regisHelper.createAuditLogs(cid, allresult, adid, 41)
                  .then(function(response){ return regisHelper.deviceActivityNotif(allresult, cid, myNode, 13); })
                  .then(function(response){
                    var finalRes = [];
                    for(var item in allresult){
                      finalRes.push(allresult[item].data);
                    }
                    res.status(200);
                    logger.log(req, res, {type: 'audit', data: allresult});
                    callback(false, finalRes, true);
                  })
                  .catch(function(err){
                    res.status(500);
                    logger.log(req, res, {type: 'error', data: err});
                    callback(true, "Error handling the data in the server", false);
                  });
                  }
                },
                // Flag to indicate sync or async loop over registration items
                // If there is semantic validation (VCNT), do a sequencial registration
                // Avoids issues with semantic repo
                !doSemanticValidation,
                // additional parameters
                { adid: adid,
                  cid:cid,
                  nodeId: nodeId,
                  nodeName: nodeName,
                  adapterType: adapterType,
                  types:semanticTypes,
                  semanticValidation:doSemanticValidation
                } // end additional parameters
              );
            }
          )
          .catch(function(err){
            res.status(500);
            logger.log(req, res, {type: 'error', data: err});
            callback(true, 'Error in comm server or sematic repository', false);
          });
        }
      }
    );
  }

  /*
  Update in Mongo dB all objects contained in the req.
  Message producing the req is sent by the agent with thingDescriptions
  */
  function update(data, req, res, callback){
    var objectsArray = data.thingDescriptions;
    var adid = typeof data.adid !== 'undefined' ? data.adid : data.agid;
    nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1, type:1},
      function(err,node){
          if(err){
            res.status(500);
            logger.log(req, res, {type: 'error', data: err});
            callback(true, "Error in Mongo",  false);
          }else if(!node){
            res.status(400);
            logger.log(req, res, {type: 'warn', data: "Invalid adid/agid identificator"});
            callback(true, "Invalid adid/agid identificator", false);
          } else {
            var nodeId = node._id;
            var nodeName = node.name;
            var myNode = {adid: adid, name: nodeName, id: nodeId};
            var cid = node.cid;
            var doSemanticValidation = config.enabledAdapters.indexOf(node.type[0]) !== -1;
            var adapterType = node.type[0] === "generic.adapter.sharq.eu" ? "shq" : "vcnt"; // TODO cover more types when needed
            var semanticTypes = {};

            // Get available item types in the semantic repository or static file
            regisHelper.getTypes(doSemanticValidation)
            .then(function(response){
              semanticTypes.services = response.services;
              semanticTypes.devices = response.devices;
              // console.timeEnd("REGISTRATION FIX PART");

              // Process new items internally
              sync.forEachAll(objectsArray,
                function(value, allresult, next, otherParams) { // Process all new items
                  regisHelper.updateDocuments(value, otherParams, function(value, result) {
                      allresult.push({data: value, result: result});
                      next();
                  });
                },
                function(allresult) {
                  // Final part: Return results, update node and notify
                  if(allresult.length === objectsArray.length){ // Only process final step if all the stack of tasks completed
                    regisHelper.createAuditLogs(cid, allresult, adid, 46)
                    .then(function(response){ return regisHelper.deviceActivityNotif(allresult, cid, myNode, 14); })
                    .then(function(response){
                      var finalRes = [];
                      var someSuccess = false; // true if some registration was successful
                      for(var item in allresult){
                        finalRes.push(allresult[item].data);
                        if(allresult[item].result === 'Success'){someSuccess = true;}
                      }
                      res.status(200);
                      logger.log(req, res, {type: 'audit', data: allresult});
                      callback(false, finalRes, true);
                      // console.timeEnd("ALL REGISTRATION EXECUTION");
                    })
                    .catch(function(err){
                      res.status(500);
                      logger.log(req, res, {type: 'error', data: err});
                      callback(true, "Error handling the data in the server", false);
                     });
                    }
                  },
                  false,
                  {
                    types:semanticTypes,
                    semanticValidation:doSemanticValidation,
                    adapterType: adapterType,
                    adid: adid,
                    req: req,
                    res: res
                  } // additional parameters
                );
              }
            )
            .catch(function(err){
              res.status(500);
              logger.log(req, res, {type: 'error', data: err});
              callback(true, 'Error in comm server or sematic repository', false);
            });
          }
        }
      );
    }

// Export Functions
module.exports.create = create;
module.exports.update = update;
