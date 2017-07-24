
// Global objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

// Function 1

function getOne(req, res, next) {

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  nodeOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });

  // EXAMPLE GET BODY
  // commServer.callCommServer({}, 'users/' + o_id, 'GET', req.headers.authorization)
  // .then(function (response) { // Example how to GET body
  //     logger.debug(response.body);
  //   },
  //   callbackError
  // )

}

// Function 2

function getAll(req, res, next) {

  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);

  userAccountOp.findById(cid).populate('hasNodes','name eventUri type hasItems').exec(function(err, data){
    if (err) {
      response =  {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }

    res.json(response);
  });

}

// Exports Functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
