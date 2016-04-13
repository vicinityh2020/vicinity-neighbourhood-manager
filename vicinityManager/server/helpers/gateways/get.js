/**
 * Created by viktor on 31.03.16.
 */
var mongoose = require('mongoose');

var gatewayOp = require('../../models/vicinityManager').gateway;

function getAll(req, res, next){
//TODO: User authentic - Role check
    var response = {};

    gatewayOp.find({}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
}

function getOne(req, res, next) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  gatewayOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  })
}

module.exports.getAll = getAll;
module.exports.getOne = getOne;
