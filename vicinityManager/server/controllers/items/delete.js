var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var myItems = require('../../services/items/deleteItems');
var logger = require("../../middlewares/logBuilder");

function deleteOne(req, res, next){
  var oid = req.params.id;
  itemOp.findOne({"oid":oid}, {adid:1})
  .then(function(response){ myItems.deleteItems([oid], req, res, response.adid.type);})
  .then(function(response){
    logger.log(req, res, {type: 'audit', data: JSON.stringify(response)});
    res.json({"error": false, "message": response});
  })
  .catch(function(err){
    logger.log(req, res, {type: 'error', data: err});
    res.json({"error": true, "message": err});});
}

module.exports.deleteOne = deleteOne;
