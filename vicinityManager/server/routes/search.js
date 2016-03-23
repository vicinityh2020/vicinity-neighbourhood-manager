var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var userAccountOp = require('../models/vicinityManager').userAccount;

router
  .get('/:searchTerm', function(req, res, next) {
//TODO: User authentic - Role check
    var response = {};
    var searchTerm = req.params.searchTerm;
  
    userAccountOp.find({'accountOf.name': searchTerm }, function(err, data) {    
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  });

module.exports = router;