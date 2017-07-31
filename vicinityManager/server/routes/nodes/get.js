
// Global objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

// Public functions

function getOne(req, res, next) {

  var response = {};
  var adid = req.params.id;
  nodeOp.findOne({adid: adid}, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });

}

// Function 2

function getAll(req, res, next) {

  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);

  userAccountOp.findById(cid, {hasNodes: 1},
    function(err, data){
      nodeOp.find({adid: { $in: data.hasNodes } }, {adid:1, name:1, eventUri:1, type:1, hasItems:1}, function(err,data){
        if (err) {
          response =  {"error": true, "message": "Error fetching data: " + err};
        } else {
          response = {"error": false, "message": data};
        }
        res.json(response);
      }
    );
  }
);

}

// Exports Functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
