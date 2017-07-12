//TODO DELETE WHOLE MODULE IF NOT NEEDED!!!!!!!!!!!

// var express = require('express');
// var router = express.Router();
// var mongoOp = require('../models/mongo');
// var mongoose = require('mongoose');
// var ObjectId = mongoose.Types.ObjectId;
//
// /* GET users listing. */
// router
//   .get('/', function(req, res, next) {
//     var response = {};
//     mongoOp.find({}, function(err, data){
//       if (err) {
//         response = {"error": true, "message": "Error fetching data"};
//       } else {
//         response = {"error": false, "message": data};
//       }
//       res.json(response);
//     });
//   })
//   .post('/', function(req, res, next) {
//     var db = new mongoOp();
//     var response = {};
//
//     db.username = req.body.username;
//     console.log("db.username" + req.body.username);
//     db.password = req.body.password;
//     console.log("db.password" + req.body.password);
//
//
//     db.save(function(err) {
//       if (err) {
//         response = {"error": true, "message": "Error adding data!"};
//       } else {
//         response = {"error": false, "message": "Data added!"};
//       }
//       res.json(response);
//     })
//   })
//   .get('/:id', function(req, res, next) {
//     var response = {};
//     var o_id = mongoose.Types.ObjectId(req.params.id);
//     mongoOp.findById(o_id, function(err, data){
//       if (err) {
//         response = {"error": true, "message": "Error fetching data"};
//       } else {
//         response = {"error": false, "message": data};
//       }
//       res.json(response);
//     })
//   })
//   .put('/:id', function(req, res, next) {
//     var response = {};
//     var o_id = mongoose.Types.ObjectId(req.params.id);
//     var updates = req.body;
//     mongoOp.update({ "_id": o_id}, updates, function(err, raw){
//       response = {"error": err, "message": raw};
//       res.json(response);
//     })
//   })
//   .delete('/:id', function(req, res, next) {
//     var response = {};
//     var o_id = mongoose.Types.ObjectId(req.params.id);
//     mongoOp.remove({ "_id" : o_id}, function(err) {
//       if (err) res.json({"error" : err});
//     });
//   });
//
// module.exports = router;
