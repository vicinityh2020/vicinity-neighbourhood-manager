var mongoose = require('mongoose');
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logBuilder");

// Update
function update(req, res, next){
    var cid = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userAccountOp.update({ "_id": cid}, updates, function(err, raw){
      if(err) logger.log(req, res, {type: 'error', data: err});
      res.json({"error": err, "message": raw});
    });
}

//Export modules
module.exports.update = update;
