var mongoose = require('mongoose');
var sInvitations = require('../../services/invitations/invitations');
var logger = require("../../middlewares/logger");

function postOne(req, res, next) {
  var userName = req.body.decoded_token.sub;
  var cid = req.body.decoded_token.cid;
  var companyId = req.body.decoded_token.orgid;
  var organisation = req.body.organisation;
  var emailTo = req.body.emailTo;
  var nameTo = req.body.nameTo;
  var type = req.body.type;
  sInvitations.postOne(userName, companyId, cid, organisation, emailTo, nameTo, type, function(err, data){
      res.json({"error": err, "message": data});
  });
}

module.exports.postOne = postOne;
