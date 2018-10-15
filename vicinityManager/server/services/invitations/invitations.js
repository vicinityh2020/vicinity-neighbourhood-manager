var mongoose = require('mongoose');
var invitationOp = require('../../models/vicinityManager').invitation;
var mailing = require('../../services/mail/mailing');
var config = require('../../configuration/configuration');

function getOne(o_id, callback) {
  // Not set the flag {new: true} --> returns old doc!
  invitationOp.findByIdAndUpdate(o_id, {$set: {used: true}}, {new: false}, function(err, data){
    if (err) {
      callback(true, {data: err, type: err});
    } else {
      callback(false, data);
    }
  });
}

function postOne(req, res, callback) {
  var userName = req.body.decoded_token.sub;
  var cid = req.body.decoded_token.cid;
  var companyId = req.body.decoded_token.orgid;
  var organisation = req.body.organisation;
  var emailTo = req.body.emailTo;
  var nameTo = req.body.nameTo;
  var type = req.body.type;

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
      thisLink = config.baseHref + "/#/invitation/newUser/" ;
      thisTmp = "inviteUser";
      thisName = product.sentBy.email;
      thisOrg = false;
    }else{
      thisLink = config.baseHref + "/#/invitation/newCompany/";
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
    return mailing.sendMail(mailInfo);
  })
  .then(function(response){
    callback(false, {user: userName, action: 'invitationSent'});
  })
  .catch(function(err){
    callback(true, err);
  });
}

module.exports.postOne = postOne;
module.exports.getOne = getOne;
