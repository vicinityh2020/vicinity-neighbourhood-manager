var mongoose = require('mongoose');

var gatewayOp = require('../../models/vicinityManager').gateway;

function putOne(req, res, next){

//TODO: User authentic - Role check
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    gatewayOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    })
}

module.exports.putOne = putOne;
