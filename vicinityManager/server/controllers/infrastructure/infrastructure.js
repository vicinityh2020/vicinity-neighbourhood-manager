// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var sInfrastructure = require("../../services/infrastructure/move");

/*
Create contracts
*/
function moveItem(req, res){
  var data = req.body;
  sInfrastructure.moveItem(data.oid, data.uidNew, data.uidOld)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

/*
Create contracts
*/
function moveContract(req, res){
  var data = req.body;
  sInfrastructure.moveContract(data.ctid, data.uidNew, data.uidOld)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

/*
Create contracts
*/
function changeGateway(req, res){
  var data = req.body;
  sInfrastructure.changeGateway(data.oid, data.adid)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

/*
Create contracts
*/
function getAvailableUsers(req, res){
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = req.query.type;
  sInfrastructure.getAvailableUsers(cid, type)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

/*
Create contracts
*/
function getAvailableGateways(req, res){
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = req.query.type;
  sInfrastructure.getAvailableGateways(cid, type)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

/*
Create contracts
*/
function sendNotification(req, res){
  var data = req.body;
  var type = req.query.type;
  // TODO consider checking that token matches one of the users or is admin of the org
  sInfrastructure.sendNotification(data.uidNew, data.uidOld, data.obj, type)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    logger.log(req, res, err);
    res.json({error: true, message: err.data});
  });
}

// Export Functions
module.exports.moveItem = moveItem;
module.exports.moveContract = moveContract;
module.exports.changeGateway = changeGateway;
module.exports.getAvailableUsers = getAvailableUsers;
module.exports.getAvailableGateways = getAvailableGateways;
module.exports.sendNotification = sendNotification;
