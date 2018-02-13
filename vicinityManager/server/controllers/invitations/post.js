var mongoose = require('mongoose');
var ce = require('cloneextend');
var invitationOp = require('../../models/vicinityManager').invitation;
var mailing = require('../../services/mail/mailing');
var logger = require("../../middlewares/logger");

function postOne(req, res, next) {
  var db = new invitationOp();
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;

  var userName = req.body.emailTo;
  db.emailTo = req.body.emailTo;
  db.nameTo = req.body.nameTo;
  db.sentBy = ce.clone(req.body.sentBy);
  db.type = req.body.type;

  db.save(function(err, product) {
    if (err) {
      logger.error({user: userName, action: 'invitationSent', message: err});
      res.json({"error": true, "message": "Error adding data!"});
    } else {
      var thisLink, thisTmp, thisName, thisOrg;

      if(product.type === 'newUser'){
        thisLink = "http://vicinity.bavenir.eu/#/invitation/newUser/" ;
        thisTmp = "inviteUser";
        thisName = product.sentBy.name;
        thisOrg = false;
      }else{
        thisLink = "http://vicinity.bavenir.eu/#/invitation/newCompany/";
        thisTmp = "inviteCompany";
        thisName = product.sentBy.name;
        thisOrg = product.sentBy.organisation;
      }

      var mailInfo = {
        link : thisLink + product._id,
        emailTo : product.emailTo,
        subject : 'Invitation email to join VICINITY',
        tmpName : thisTmp,
        name : product.nameTo,
        sentByName : thisName,
        sentByOrg : thisOrg
      };

      logger.audit({user: userName, action: 'invitationSent'});
      mailing.sendMail(mailInfo);
      res.json(response = {"error": false, "message": "Data added!"});
    }
  });
}

module.exports.postOne = postOne;
