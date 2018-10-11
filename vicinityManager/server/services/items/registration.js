// Global Objects

var itemOp = require('../../models/vicinityManager').item;
var nodeOp = require('../../models/vicinityManager').node;
var regisHelper = require('../../services/items/registrationHelper');
var logger = require('../../middlewares/logger');
var config = require('../../configuration/configuration');
var sync = require('../../services/asyncHandler/sync');

// Public Function -- Main

/*
Save in Mongo dB all objects contained in the req.
Message producing the req is sent by the agent with thingDescriptions
*/
function create(data, callback){
  var objectsArray = data.thingDescriptions;
  var adid = typeof data.adid !== 'undefined' ? data.adid : data.agid;

  // console.time("ALL REGISTRATION EXECUTION");
  // console.time("REGISTRATION FIX PART");

  nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1, type:1},
    function(err,data){
        if(err){
          callback(true, "Error in Mongo", err);
        }else if(!data){
          callback(true, "Invalid adid/agid identificator", "Invalid adid/agid identificator");
        } else {
          var nodeId = data._id;
          var nodeName = data.name;
          var cid = data.cid;
          var doSemanticValidation = config.enabledAdapters.indexOf(data.type[0]) !== -1;
          var adapterType = data.type[0] === "generic.adapter.sharq.eu" ? "shq" : "vcnt"; // TODO cover more types when needed
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
                regisHelper.saveDocuments(value, otherParams, function(value, result) {
                    allresult.push({data: value, result: result});
                    next();
                });
              },
              function(allresult) {
                // Final part: Return results, update node and notify
                if(allresult.length === objectsArray.length){ // Only process final step if all the stack of tasks completed
                  regisHelper.updateItemsList(data.hasItems, allresult)
                  .then(function(response){
                    data.hasItems = response;
                    return data.save();
                  })
                  .then(function(response){ return regisHelper.createAuditLogs(cid, allresult, adid, 41); })
                  .then(function(response){
                    var finalRes = [];
                    var someSuccess = false; // true if some registration was successful
                    for(var item in allresult){
                      finalRes.push(allresult[item].data);
                      if(allresult[item].result === 'Success'){someSuccess = true;}
                    }
                    callback(false, finalRes, allresult);
                    // console.timeEnd("ALL REGISTRATION EXECUTION");
                  })
                  .catch(function(err){ callback(true, "Error handling the data in the server", err); });
                  }
                },
                false,
                { adid: adid,
                  cid:cid,
                  nodeId: nodeId,
                  data:data,
                  types:semanticTypes,
                  semanticValidation:doSemanticValidation,
                  adapterType: adapterType,
                  nodeName: nodeName } // additional parameters
              );
            }
          )
          .catch(function(err){callback(true, 'Error in comm server or sematic repository', err); });
        }
      }
    );
  }

  /*
  Update in Mongo dB all objects contained in the req.
  Message producing the req is sent by the agent with thingDescriptions
  */
  function update(data, callback){
    var objectsArray = data.thingDescriptions;
    var adid = typeof data.adid !== 'undefined' ? data.adid : data.agid;
    nodeOp.findOne({adid: adid, status: "active"}, {cid:1, hasItems: 1, type:1},
      function(err,node){
          if(err){
            callback(true, "Error in Mongo",  err);
          }else if(!node){
            callback(true, "Invalid adid/agid identificator", "Invalid adid/agid identificator");
          } else {
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
                    .then(function(response){
                      var finalRes = [];
                      var someSuccess = false; // true if some registration was successful
                      for(var item in allresult){
                        finalRes.push(allresult[item].data);
                        if(allresult[item].result === 'Success'){someSuccess = true;}
                      }
                      callback(false, finalRes, allresult);
                      // console.timeEnd("ALL REGISTRATION EXECUTION");
                    })
                    .catch(function(err){ callback(true, "Error handling the data in the server", err); });
                    }
                  },
                  false,
                  {
                    data:data,
                    types:semanticTypes,
                    semanticValidation:doSemanticValidation,
                    adapterType: adapterType,
                    adid: adid
                  } // additional parameters
                );
              }
            )
            .catch(function(err){callback(true, 'Error in comm server or sematic repository', err); });
          }
        }
      );
    }

// Export Functions
module.exports.create = create;
module.exports.update = update;
