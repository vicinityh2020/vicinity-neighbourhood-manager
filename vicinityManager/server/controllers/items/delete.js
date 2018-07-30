var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var myItems = require('../../services/items/deleteItems');
var logger = require("../../middlewares/logger");

function deleteOne(req, res, next){
  var oid = req.params.id;
  userOp.findOne({"oid":oid}, {adid:1})
  .then(function(response){ myItems.deleteItems([oid], req.body.decoded_token.sub, response.adid.type);})
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

module.exports.deleteOne = deleteOne;
