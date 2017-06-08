var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

function postOne(req, res, next) {
  var db = new nodeOp();
  var response = {};
  var cid = mongoose.Types.ObjectId(req.params.id);
  db.name = req.body.name;
  db.eventUri = req.body.eventUri;
  db.agent = req.body.agent;
  db.type = req.body.type;
  db.status = "active";

  db.save(function(err,data){
    if(err){
      logger.debug("Error creating the node");
    }else{
      userAccountOp.update({ "_id": cid}, {$push: {hasNodes:data._id}}, function(err, data2){
      response = {"error": false, "message": data};
      res.json(response);
      });
    }
  });
}

module.exports.postOne = postOne;
