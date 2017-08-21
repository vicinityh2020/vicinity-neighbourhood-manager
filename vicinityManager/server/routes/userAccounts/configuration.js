// Global objects
var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var companyAccountOp = require('../../models/vicinityManager').userAccount;

// Public functions

function get(req, res, next) {

  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  companyAccountOp.findById(cid, {skinColor: 1}, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

function put(req, res, next) {

  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  var update = req.body;

  companyAccountOp.update(cid, {$set: update },
    function(err, data){
      if (err) {
        response =  {"error": true, "message": "Error fetching data: " + err};
      } else {
        response = {"error": false, "message": "Successfully updated!"};
      }
      res.json(response);
    }
  );

}

// Exports Functions

module.exports.get = get;
module.exports.put = put;
