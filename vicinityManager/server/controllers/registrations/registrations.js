//Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sGet = require("../../services/registrations/get.js");
var sRegister = require("../../services/registrations/register.js");

// Functions

/*
Get one registration
*/
function getOne(req, res){
  var id = mongoose.Types.ObjectId(req.params.id);
  sGet.getOne(id, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Get all organisation registrations
*/
function getAll(req, res, next) {
  sGet.getAll("newCompany", function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Request a user or organisation registration
*/
function requestRegistration(req, res, next) {
  var data = req.body;
  sRegister.requestReg(data, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Create a new user or organisation
*/
function createRegistration(req, res, next) {
  var id = req.params.id;
  var data = req.body;
  sRegister.createReg(id, data, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Looking for duplicates in user registration
*/
function findDuplicatesUser(req, res, next) {
  var data = req.body;
  sRegister.findDuplicatesUser(data)
  .then(function(response){
    res.json({error: false, message: response});
  })
  .catch(function(err){
    res.json({error: true, message: err});
  });
}

/*
Looking for duplicates in company registration
*/
function findDuplicatesCompany(req, res, next) {
  var data = req.body;
  sRegister.findDuplicatesCompany(data)
    .then(function(response){
      res.json({error: false, message: response});
    })
    .catch(function(err){
      res.json({error: true, message: err});
    });
  }

  /*
  Looking for duplicates in user registration
  */
  function findDuplicatesRegMail(req, res, next) {
    var data = req.body;
    sRegister.findDuplicatesRegMail(data)
    .then(function(response){
      res.json({error: false, message: response});
    })
    .catch(function(err){
      res.json({error: true, message: err});
    });
  }

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.requestRegistration = requestRegistration;
module.exports.createRegistration = createRegistration;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
