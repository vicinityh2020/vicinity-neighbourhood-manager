var espress = require('express');
var router = require('express').Router();
var mongoose = require('mongoose');

var gatewayOp = require('../models/vicinityManager').gateway;

router
  .get('/', function(req, res, next) {
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
  })
  .post('/', function(req, res, next) {
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
  })
  .get('/:id', function(req, res, next) {
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
  })
  .put('/:id', function(req, res, next) {
//TODO: User authentic - Role check
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    gatewayOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    })
  })
  .delete('/:id', function(req, res, next) {
//TODO: User authentic - Role check
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    gatewayOp.remove({ "_id" : o_id}, function(err) {
      res.json({"error" : err});
    });
  });

module.exports = router;