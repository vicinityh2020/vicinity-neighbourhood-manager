var mongoose = require('mongoose');
var sInvitations = require('../../services/invitations/invitations');
var logger = require("../../middlewares/logger");

function getOne(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  sInvitations.getOne(o_id, function(err, data){
      res.json({"error": err, "message": data});
  });
}

module.exports.getOne = getOne;
