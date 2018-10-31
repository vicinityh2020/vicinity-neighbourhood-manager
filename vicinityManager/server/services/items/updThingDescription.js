// Global Objects

var itemOp = require('../../models/vicinityManager').item;
var logger = require('../../middlewares/logger');
var semanticRepo = require('../../services/semanticRepo/request');
var sync = require('../../services/asyncHandler/sync');
var audits = require('../../services/audit/audit');

// Public function

function updateContents(data, callback){
  return new Promise(function(resolve, reject) {
    try{
      sync.forEachAll(data,
        function(value, allresult, next){ // Process all updated items
          updating(value, function(result){
              allresult.push(result);
              next();
          }
        );
      },
      function(allresult) {
        // Final part
        if(allresult.length === data.length){ // Only process final step if all the stack of tasks completed
          resolve(allresult);
          }
        },
        false,
        {} // additional parameters
      );
    } catch(err) { // Catch error in main module
      reject(err);
    }
  });
}

// Private functions

/*
Updates MONGO item model of the given object
*/
function updating(objects, callback){
  // Prepare objects
  var oid = objects.oid;
  var infra_id = objects["infrastructure-id"];
  var name = objects.name;
  delete objects["infrastructure-id"]; // remove infrastructure-id, no need to pass it further
  // Update in semantic repository
  semanticRepo.callSemanticRepo(objects, "td/create", "PUT")
  .then(function(response){
    var repoAnswer = JSON.parse(response);
    if(!(repoAnswer.data.hasOwnProperty('errors'))) {
      var info = JSON.parse(response).data.lifting; // Thing description obj, stores response from semanticRepo
      updateInstance(oid, infra_id, name, info, callback);
    } else { // If lifting ends with error ...
      callback({oid: oid, "infrastructure-id": infra_id, success: false, error: repoAnswer.data.errors});
    }
  })
  .catch(function(err){callback({oid: oid, "infrastructure-id": infra_id, success: false, error: err}, err); });
}

/*
Updates MONGO item model of the given object
*/
function updateInstance(oid, infra_id, name, info, callback){
  itemOp.update({oid: oid}, {$set: {info: info, name: name}})
  .then(function(response){
    callback({oid: oid, "infrastructure-id": infra_id, success: true});
  })
  .catch(function(err){
    callback({oid: oid, "infrastructure-id": infra_id, success: false, error: err});
  });
}

// Export Functions
module.exports.updateContents = updateContents;
