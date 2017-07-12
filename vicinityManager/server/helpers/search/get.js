// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemProperties = require("../../helpers/items/additionalItemProperties");

// Public functions

  /*
  Looks for a substring match whithin the userAccount collection
  Organisation is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
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

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(req, res, next) {
    var response = {};
    var searchTerm = req.query.searchTerm;
    var sT = new RegExp(searchTerm, 'i');
    // logger.debug(searchTerm);
    userOp.find({$query: {name: sT}, $hint: { name : 1 }}, function(err, data) {
      if (!data || err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  }

  /*
  Looks for a substring match whithin the item collection
  Name is used as a index and it is the field we compare
  Access level restrictions apply!
  Text index are not used because do not support substring look up!
  */
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
      $or :[
      {$and: [ { hasAdministrator: {$in: friends}}, { accessLevel: {$in: [2, 3, 4]} } ] },
      { accessLevel: { $gt:4 } },
      {$and: [ { hasAdministrator: cid}, {accessLevel: 1} ] }
      ]
    };

    itemOp.find({$query: query ,$hint: { name : 1 }}).populate('hasAdministrator','organisation').exec(function(err, data){
      if (!data ||err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,cid,friends);
        response = {"error": false, "message": dataWithAdditional};
      }
      res.json(response);
    });

  }

// Export modules

  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
