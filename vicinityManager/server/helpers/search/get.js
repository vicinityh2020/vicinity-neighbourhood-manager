var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;


  function searchOrganisation(req, res, next) {
    var response = {};
    var searchTerm = req.query.searchTerm;
    var sT = new RegExp(searchTerm, 'i');
    // logger.debug(searchTerm);
    userAccountOp.find({$query: {organisation: sT}, $hint: { organisation : 1 }}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  }

  function searchUser(req, res, next) {
    var response = {};
    var searchTerm = req.query.searchTerm;
    var sT = new RegExp(searchTerm, 'i');
    // logger.debug(searchTerm);
    userOp.find({$query: {name: sT}, $hint: { name : 1 }}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  }

  function searchItem(req, res, next) {
    var response = {};
    var friends = []; // Will contain company partners and itself
    var searchTerm = req.query.searchTerm;
    var cid = mongoose.Types.ObjectId(req.params.cid);
    var sT = new RegExp(searchTerm, 'i');

    friends.push(cid);
    var i = 0;
    for(i; i < req.body.length; i++){
      friends.push(mongoose.Types.ObjectId(req.body[i]));
    }

    var query = {
      name: sT,
      status:'enabled',
      $or: [
        {
          $and: [
            {hasAdministrator:cid},
            {accessLevel:1}
          ]
        },
        {
          $and:[
            {hasAdministrator:{$in:friends}},
            {accessLevel:{$in:[2,3]}}
          ]
        },
        {
          accessLevel:4
        }
      ]
    };

    itemOp.find({$query: query ,$hint: { name : 1 }}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });

  }


  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
