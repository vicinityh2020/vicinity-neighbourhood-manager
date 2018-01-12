// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var audits = require('../../routes/audit/put');
var contractOp = require('../../models/vicinityManager').contract;
var notificationOp = require('../../models/vicinityManager').notification;
var sharingRules = require('../../helpers/sharingRules');

/*
Remove contract
// TODO Create notification
// TODO Create audit
*/
function removeContract(req, res){
  var id = req.params.id;
  remove(id, function(res, err){
    res.json({error: err, message: res});
  });
}

function removing(id, callback){
  var finalResp;
  var data = {};
  var query = {
    serviceProvider:{},
    iotOwner:{},
    accessRights: "",
    legalDescription: "",
    status: 'deleted'
    };

  contractOp.find({_id:id})
  .then(function(response){
    data = JSON.parse(JSON.stringify(response)); // Get rid of metadata
    return contractOp.update({_id:id}, {$set: query} );
  })
  .then(function(response){
    return sharingRules.cancelContract(data.ctid);
  })
  .then(function(response){
    finalResp = response;

    var cidService = data.serviceProvider.cid.extid;
    var cidDevice = data.iotOwner.cid.extid;
    var ctid = {id: data._id, extid: data.ctid};
    var uidService = data.serviceProvider.uid.id;
    var idsService = [];
    getOnlyId(idsService, data.serviceProvider.items);
    var uidDevice = data.iotOwner.uid.id;
    var idsDevice = [];
    getOnlyId(idsDevice, data.iotOwner.items);
    return userOp.update({_id: uidDevice}, { $pull: {hasContracts: ctid} });
  })
  .then(function(response){
      return itemOp.update({_id: {$in: idsDevice }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    return userOp.update({_id: uidService}, { $pull: {hasContracts: ctid} });
  })
  .then(function(response){
    return itemOp.update({_id: {$in: idsService }}, { $pull: {hasContracts: ctid} }, { multi: true });
  })
  .then(function(response){
    callback(finalResp, false);
  })
  .catch(function(error){
    callback(error, true);
  });

}

// Private Functions

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id);
  }
}

// Export modules

module.exports.removeContract = removeContract;
module.exports.removing = removing;
