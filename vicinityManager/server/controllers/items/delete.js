var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var myItems = require('../../services/items/deleteItems');
var logger = require("../../middlewares/logger");

function deleteOne(req, res, next){
  var oid = req.params.id;
  itemOp.findOne({"oid":oid}, {adid:1})
  .then(function(response){ myItems.deleteItems([oid], req.body.decoded_token.sub, response.adid.type);})
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){
    logger.debug(err);
    res.json({"error": true, "message": err});});
}

module.exports.deleteOne = deleteOne;
