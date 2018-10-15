var mongoose = require('mongoose');
var sInvitations = require('../../services/invitations/invitations');
var logger = require("../../middlewares/logBuilder");

function postOne(req, res, next) {
    sInvitations.postOne(req, res, function(err, response){
    if(err){
      logger.log(req, res, {type:'error', data: response});
    } else {
      logger.log(req, res, {type:'audit', data: response});
    }
    res.json({"error": err, "message": response});
  });
}

module.exports.postOne = postOne;
