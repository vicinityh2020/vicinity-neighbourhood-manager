var mongoose = require('mongoose');
var sInvitations = require('../../services/invitations/invitations');
var logger = require("../../middlewares/logBuilder");

function getOne(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  sInvitations.getOne(o_id, function(err, response){
    if(err){
      logger.log(req, res, response);
      res.json({"error": err, "message": response.data});
    } else {
      res.json({"error": err, "message": response});
    }
  });
}

module.exports.getOne = getOne;
