// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;

/*
Get contracts
*/
function fetchContract(req, res){
  var id = req.params.id; // User id
  var parsedData = {};
  userOp.findOne({ _id: id}, {hasContracts:1})
  .then(function(response){
    parsedData = response.toObject();
    var ct_ids = [];
    if(parsedData.hasContracts.length != null){
      getOnlyId(ct_ids, parsedData.hasContracts);
    }
    return contractOp.find({_id: {$in: ct_ids}, status: {$ne: "deleted"}});
  })
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(error){
    res.json({error: true, message: error});
  });
}


function fetchContractDetails(req, res){
  var id = req.params.id; // User id
  contractOp.findOne({_id: id}).populate('iotOwner.cid.id', 'name').populate('iotOwner.items.id', 'name').populate('serviceProvider.cid.id', 'name').populate('serviceProvider.items.id', 'name')
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(error){
    res.json({error: true, message: error});
  });
}

// Private Functions

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    array.push(toAdd[i].id);
  }
}

// Export modules
module.exports.fetchContract = fetchContract;
module.exports.fetchContractDetails = fetchContractDetails;
