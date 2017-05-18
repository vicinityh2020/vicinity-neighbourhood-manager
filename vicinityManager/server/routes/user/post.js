module.exports.postOne = postOne;

var mongoose = require('mongoose');
var ce = require('cloneextend');

var userOp = require('../../models/vicinityManager').user;

function postOne(req, res, next) {

  var db = new userOp();
  var response = {};

  db.avatar =  req.body.avatar;
  db.name = req.body.name;
  db.firstName = req.body.firstName;//Users that are creator UserAccount
  db.surname = req.body.surname; //Follows UserAccounts
  db.lastname = req.body.lastname; //Member of UserGroups
  db.occupation = req.body.occupation;
  db.location = req.body.location;
  db.email = req.body.email;
  db.authentication = ce.clone(req.body.authentication);

  db.save(function(err) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });
}
