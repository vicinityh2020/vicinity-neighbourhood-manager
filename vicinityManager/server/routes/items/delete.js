var mongoose = require('mongoose');
var myItems = require('../../helpers/items/deleteItems');
var logger = require("../../middlewares/logger");

function deleteOne(req, res, next){
  var oid = req.params.id;
  myItems.deleteItems([oid], res);
}

module.exports.deleteOne = deleteOne;
