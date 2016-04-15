var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;

function postOne(req, res, next) {
  var db = new itemOp();
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
