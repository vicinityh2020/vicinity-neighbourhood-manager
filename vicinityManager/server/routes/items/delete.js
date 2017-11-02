var mongoose = require('mongoose');
var myItems = require('../../helpers/items/deleteItems');
var logger = require("../../middlewares/logger");

function deleteOne(req, res, next){
  var oid = req.params.id;
  myItems.deleteItems([oid])
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

module.exports.deleteOne = deleteOne;
