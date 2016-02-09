var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var userGroupOp = require('../models/vicinityManager').userGroup;

router
  .get('/', function(req, res, next) {
//TODO: test authorized roles
    var response = {};
  
    userGroupOp.find({}, function(err, data) {    
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  })
  .post('/', function(req, res, next) {
    var db = new userGroupOp();
    var response = {};
//TODO: body model atributes should be check not to throw exceptions;    
    db.name = req.body.name;
    db.avatar = req.body.avatar;
//TODO: hasAdministrator should be resolved from the token;
    db.hasAdministrator = mongoose.Types.ObjectId(req.params.hasAdministrator);
  
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
//TODO: test authorized roles
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userGroupOp.findById(o_id, function(err, data){
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    })
  })
  .put('/:id', function(req, res, next) {
//TODO: test authorized roles
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userGroupOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    })
  })
  .delete('/:id', function(req, res, next) {
//TODO: test authorized roles
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userGroupOp.remove({ "_id" : o_id}, function(err) {
      res.json({"error" : err});
    });
  });

module.exports = router;