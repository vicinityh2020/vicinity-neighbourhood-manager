var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var myItems = require('../../services/items/deleteItems');
var logger = require("../../middlewares/logger");

function deleteOne(req, res, next){
  var oid = req.params.id;
  itemOp.findOne({"oid":oid}, {adid:1})
  .then(function(response){ return myItems.deleteItems([oid], req, res, response.adid.type);})
  .then(function(response){
    if(response.message.length === 1 && response.message[0].error){
      res.json({"error": true, "message": response.message[0].result});
    } else {
      res.json({"error": false, "message": response});
    }
  })
  .catch(function(err){
    res.json({"error": true, "message": err});});
}

module.exports.deleteOne = deleteOne;
