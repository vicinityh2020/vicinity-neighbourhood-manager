var mongoose = require('mongoose');
var ce = require('cloneextend');
var invitationOp = require('../../models/vicinityManager').invitation;
var mailing = require('../../helpers/mail/mailing');


function postOne(req, res, next) {
  var db = new invitationOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;

  db.emailTo = req.body.emailTo;
  db.nameTo = req.body.nameTo;
  db.sentBy = ce.clone(req.body.sentBy);
  db.type = req.body.type;

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      response = {"error": false, "message": "Data added!"};

      if(product.type === 'newUser'){
        var thisLink = "http://localhost:8000/app/#/invitation/newUser/" ;
        var thisTmp = "inviteUser";
        var thisName = product.sentBy.name;
        var thisOrg = false;
      }else{
        var thisLink = "http://localhost:8000/app/#/invitation/newCompany/";
        var thisTmp = "inviteCompany";
        var thisName = product.sentBy.name;
        var thisOrg = product.sentBy.organisation;
      }

      var mailInfo = {
        link : thisLink + product._id,
        emailTo : product.emailTo,
        subject : 'Invitation email to join VICINITY',
        tmpName : thisTmp,
        name : product.nameTo,
        sentByName : thisName,
        sentByOrg : thisOrg
      }

      mailing.sendMail(mailInfo);
    }
    res.json(response);
  });
}

module.exports.postOne = postOne;
