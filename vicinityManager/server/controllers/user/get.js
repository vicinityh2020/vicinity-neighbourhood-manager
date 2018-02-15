// Global variables and packages
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sGetUser = require('../../services/users/getUsers');

// Public functions

function getOne(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  sGetUser.getOne(o_id, function(err,response){
    res.json({error: err, message: response});
  });
}

function getAll(req, res, next) {
  var othercid = mongoose.Types.ObjectId(req.params.id);
  var mycid = mongoose.Types.ObjectId(req.query.mycid);
  sGetUser.getAll(othercid, mycid, function(err,response){
    res.json({error: err, message: response});
  });
}


// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
