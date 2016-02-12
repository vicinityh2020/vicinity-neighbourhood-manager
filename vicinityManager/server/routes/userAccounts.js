var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var userAccountOp = require('../models/vicinityManager').userAccount;

router
  .get('/', function(req, res, next) {
    var response = {};
    debugger;
    userAccountOp.find({}, function(err, data) {    
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  })
  .post('/', function(req, res, next) {
    var db = new userAccountOp();
    var response = {};
    
    db.email = req.body.email;
    db.avatar = req.body.avatar;
    db.authentication = {
      password: req.body.authentication.password,
      principalRoles: req.body.authentication.principalRoles,
    }
    
    db.creatorOf = req.body.creatorOf;
    db.follows = req.body.follows;
    db.memberOf = req.body.memberOf;
        
    db.accountOf.name = req.body.accountOf.name;
    db.accountOf.firstName = req.body.accountOf.firstName;
    db.accountOf.surname = req.body.accountOf.surname;
    db.accountOf.lastName = req.body.accountOf.lastName;
    
    db.knows = req.body.knows;
  
    db.modifierOf = req.body.modifierOf;
  
    db.administratorOf = req.body.administratorOf;
  
  
    db.save(function(err) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
      } else {
        response = {"error": false, "message": "Data added!"};
      }
      res.json(response);
    });
  })
  .get('/:id', function(req, res, next) {
    debugger;
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userAccountOp.findById(o_id, function(err, data){
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    })
  })
  .put('/:id', function(req, res, next) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userAccountOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    })
  })
  .delete('/:id', function(req, res, next) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userAccountOp.remove({ "_id" : o_id}, function(err) {
      res.json({"error" : err});
    });
  });

module.exports = router;