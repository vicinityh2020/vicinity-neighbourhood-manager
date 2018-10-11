//Global objects and variables

var mongoose = require('mongoose');
var registrationOp = require('../../models/vicinityManager').registration;

// Functions

function getOne(id, callback) {
  registrationOp.findById(id, function(err, data){
    if (err) {
      callback(true, {data: err, type: "error"});
    } else {
      callback(false, {data: data, type: "info"});
    }
  });
}

function getAll(type, callback){
  registrationOp.find({type: type}, function(err, data) {
    if (err) {
      callback(true, {data: err, type: "error"});
    } else {
      callback(false, {data: data, type: "info"});
    }
  });
}

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
