//Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sGet = require("../../helpers/registrations/get.js");
var sRegister = require("../../helpers/registrations/register.js");

// Functions

/*
Get one registration
*/
function getOne(req, res){
  var id = mongoose.Types.ObjectId(req.params.id);
  sGet.getOne(id, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Get all organisation registrations
*/
function getAll(req, res, next) {
  sGet.getAll("newCompany", function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Request a user or organisation registration
*/
function requestRegistration(req, res, next) {
  var data = req.body;
  sRegister.requestReg(data, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Create a new user or organisation
*/
function createRegistration(req, res, next) {
  var id = req.params.id;
  var data = req.body;
  sRegister.createReg(id, data, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Looking for duplicates in user registration
*/
function findDuplicatesUser(req, res, next) {
  var data = req.body;
  sRegister.findDuplicatesUser(data, function(response, err){
    res.json({error: err, message: response});
  });
}

/*
Looking for duplicates in company registration
*/
function findDuplicatesCompany(req, res, next) {
  var data = req.body;
  sRegister.findDuplicatesCompany(data, function(response, err){
    res.json({error: err, message: response});
  });
}

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.requestRegistration = requestRegistration;
module.exports.createRegistration = createRegistration;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
