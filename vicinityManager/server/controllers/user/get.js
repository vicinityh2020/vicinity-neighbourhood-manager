// Global variables and packages
var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sGetUser = require('../../services/users/getUsers');

// Public functions

function getOne(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var api = false;
  sGetUser.getOne(o_id, api, function(err,response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
    } else {
      res.json({error: err, message: response});
    }
  });
}

function getAll(req, res, next) {
  var api = false;
  sGetUser.getAll(req, res, api, function(err,response){
    if(err){
      logger.log(req,res,{type: 'error', data: response});
      res.json({error: err, message: response});
    } else {
      res.json({error: err, message: response});
    }
  });
}


// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
