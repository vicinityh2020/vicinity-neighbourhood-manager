// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var ctChecks = require("../../services/contracts/contractChecks.js");
var ctHelper = require("../../services/contracts/contracts.js");
var contractOp = require('../../models/vicinityManager').contract;
var userOp = require('../../models/vicinityManager').user;

/*
Create contracts
*/
function createContract(req, res){
  ctChecks.isUnique(req, res, function(err, response){
    if(err) {
      res.status(500);
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
    } else if(response){ // Contract is unique
      ctHelper.creating(req, res, function(err, response){
        if(err) logger.log(req, res, {type: 'error', data: response});
        res.json({error: err, message: response});
      });
    } else {
      res.status(400);
      res.json({error: false, message: 'Contract must be unique'});
    }
  });
}

/*
Accept contracts
*/
function acceptContract(req, res){
  ctHelper.accepting(req, res, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Modify contracts
*/
// function modifyContract(req, res){
//   ctHelper.removing(req, res, function(err, response){
//     if(err){
//       logger.log(req, res, {type: 'error', data: response});
//       res.json({error: err, message: response});
//     } else {
//       ctHelper.creating(req, res, function(err, response){
//         if(err) logger.log(req, res, {type: 'error', data: response});
//         res.json({error: err, message: response});
//       });
//     }
//   });
// }

/*
Delete contracts
*/
function removeContract(req, res){
  ctHelper.removing(req, res, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Disable one item
*/
function disableOneItem(req, res){
  ctHelper.pauseContracts(req, res)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err});
  });
}

/*
Enable one item
*/
function enableOneItem(req, res){
  ctHelper.enableOneItem(req, res)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err});
  });
}

/*
Enable one item
*/
function removeOneItem(req, res){
  ctHelper.removeOneItem(req, res)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err});
  });
}

/*
Get contract
*/
function fetchContract(req, res){
  var parsedData = {};
  ctHelper.fetchContract(req, res)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({error: true, message: err});
  });
}

// Export modules

module.exports.fetchContract = fetchContract;
module.exports.removeContract = removeContract;
module.exports.createContract = createContract;
module.exports.acceptContract = acceptContract;
// module.exports.modifyContract = modifyContract;
module.exports.disableOneItem = disableOneItem;
module.exports.enableOneItem = enableOneItem;
module.exports.removeOneItem = removeOneItem;
