var express = require('express');
var router = express.Router();
var mongoOp = require('../model/mongo')

/* GET users listing. */
router
  .get('/', function(req, res, next) {
    var response = {};
    mongoOp.find({}, function(err, data){
      if (err) {
        response = {"error": true, "message": "Error fetching dataa"};
      } else {
        response = {"error": false, "message": data};
      }            
      res.json(response);
    });
  })
  .post('/', function(req, res, next) {
    var db = new mongoOp();
    var response = {};
  
    db.username = req.body.username;
    console.log("db.username" + req.body.username);
    db.password = req.body.password;
    console.log("db.password" + req.body.password);  
  
  
    db.save(function(err) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
      } else {
        response = {"error": false, "message": "Data added!"};
      }
      res.json(response);
    })
  });

module.exports = router;
