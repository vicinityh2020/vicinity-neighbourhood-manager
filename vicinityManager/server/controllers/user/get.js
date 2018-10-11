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
      logger.log(req,res,response);
      res.json({error: err, message: response.data});
    } else {
      res.json({error: err, message: response.data});
    }
  });
}

function getAll(req, res, next) {
  var othercid = mongoose.Types.ObjectId(req.params.id);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var api = false;
  sGetUser.getAll(othercid, mycid, api, function(err,response){
    if(err){
      logger.log(req,res,response);
      res.json({error: err, message: response.data});
    } else {
      res.json({error: err, message: response.data});
    }
  });
}


// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
