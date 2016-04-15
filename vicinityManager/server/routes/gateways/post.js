/**
 * Created by viktor on 31.03.16.
 */
var mongoose = require('mongoose');

var gatewayOp = require('../../models/vicinityManager').gateway;

function postOne(req, res, next){

    var db = new gatewayOp();
    var response = {};
  //TODO: Request body atributes null check;
  //TODO: ObjectId conversion;
    db.name = req.body.name;
    db.consistsOf = req.body.consistsOf;

    db.save(function(err) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
      } else {
        response = {"error": false, "message": "Data added!"};
      }
      res.json(response);
    });
}

module.exports.postOne = postOne;
