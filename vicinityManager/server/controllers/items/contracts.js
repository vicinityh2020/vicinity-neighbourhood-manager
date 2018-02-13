// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var ctHelper = require("../../services/contracts/contracts.js");
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;

/*
Create contracts
*/
function createContract(req, res){
  var data = req.body;
  ctHelper.creating(data, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Accept contracts
*/
function acceptContract(req, res){
  var id = req.params.id;
  ctHelper.accepting(id, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Modify contracts
*/
function modifyContract(req, res){
  var id = req.params.id;
  var data = req.body;
  ctHelper.removing(id, function(response, err){
    if(err){
      res.json({error: err, message: response});
    } else {
      ctHelper.creating(data, function(response, err){
        res.json({error: err, message: response});
      });
    }
  });
}

/*
Delete contracts
*/
function removeContract(req, res){
  var id = req.params.id;
  ctHelper.removing(id, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Get contract
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
    return contractOp.find({_id: {$in: ct_ids}, status: {$ne: "deleted"}}).populate('iotOwner.cid.id', 'name').populate('iotOwner.items.id', 'name').populate('serviceProvider.cid.id', 'name').populate('serviceProvider.items.id', 'name');
  })
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
module.exports.removeContract = removeContract;
module.exports.createContract = createContract;
module.exports.acceptContract = acceptContract;
module.exports.modifyContract = modifyContract;
