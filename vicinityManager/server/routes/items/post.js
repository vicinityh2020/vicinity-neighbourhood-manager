var mongoose = require('mongoose');
var ce = require('cloneextend');
var itemOp = require('../../models/vicinityManager').item;

function postOne(req, res, next) {
  var db = new itemOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;
  db.name = req.body.name;
  db.consistsOf = req.body.consistsOf;
  db.hasAdministrator = ce.clone(req.body.hasAdministrator);
  db.accessRequestFrom = ce.clone(req.body.accessRequestFrom);
  db.accessLevel = req.body.accessLevel;
  db.hasAccess = ce.clone(req.body.hasAccess);
  db.color = req.body.color;
  db.avatar = req.body.avatar;
  db.electricity = ce.clone(req.body.electricity);

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
