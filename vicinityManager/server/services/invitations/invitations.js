var mongoose = require('mongoose');
var invitationOp = require('../../models/vicinityManager').invitation;
var mailing = require('../../services/mail/mailing');
var logger = require("../../middlewares/logger");

function getOne(o_id, callback) {
  // Not set the flag {new: true} --> returns old doc!
  invitationOp.findByIdAndUpdate(o_id, {$set: {used: true}}, {new: false}, function(err, data){
    if (err) {
      callback(true, err);
    } else {
      callback(false, data);
    }
  });
}

function postOne(userName, companyId, cid, organisation, emailTo, nameTo, type, callback) {
  var db = new invitationOp();
  var mailInfo;
  var thisLink, thisTmp, thisName, thisOrg;

  db.emailTo = emailTo;
  db.nameTo = nameTo;
  db.sentBy =
      {
        companyId: companyId,
        cid: cid,
        organisation: organisation,
        email: userName
      };
  db.type = type;

  db.save()
  .then(function(product){
    if(product.type === 'newUser'){
      thisLink = "http://vicinity.bavenir.eu/#/invitation/newUser/" ;
      thisTmp = "inviteUser";
      thisName = product.sentBy.email;
      thisOrg = false;
    }else{
      thisLink = "http://vicinity.bavenir.eu/#/invitation/newCompany/";
      thisTmp = "inviteCompany";
      thisName = product.sentBy.email;
      thisOrg = product.sentBy.organisation;
    }
    mailInfo = {
      link : thisLink + product._id,
      emailTo : product.emailTo,
      subject : 'Invitation email to join VICINITY',
      tmpName : thisTmp,
      name : product.nameTo,
      sentByName : thisName,
      sentByOrg : thisOrg
    };
    logger.audit({user: userName, action: 'invitationSent'});
    return mailing.sendMail(mailInfo);
  })
  .then(function(response){
    callback(false, "Invitation processed!");
  })
  .catch(function(err){
    logger.error({user: userName, action: 'invitationSent', message: err});
    callback(true, err);
  });
}

module.exports.postOne = postOne;
module.exports.getOne = getOne;
