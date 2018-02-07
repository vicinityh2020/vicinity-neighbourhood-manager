//Global objects and variables

var mongoose = require('mongoose');
var registrationOp = require('../../models/vicinityManager').registration;
var logger = require("../../middlewares/logger");

// Functions

function getOne(id, callback) {
  registrationOp.findById(id, function(err, data){
    if (err) {
      callback(true, "Error fetching data");
    } else {
      callback(false, data);
    }
  });
}

function getAll(type, callback){
  registrationOp.find({type: type}, function(err, data) {
    if (err) {
      callback(true, "Error fetching data");
    } else {
      callback(false, data);
    }
  });
}

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
