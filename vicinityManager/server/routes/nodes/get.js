var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");


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
  })
}

function getAll(req, res, next) {

  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);

  userAccountOp.findById(cid).populate('hasNodes','name eventUri type').exec(function(err, data){
    if (err) {
      response =  {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    };

    res.json(response);
  });

}

module.exports.getOne = getOne;
module.exports.getAll = getAll;
