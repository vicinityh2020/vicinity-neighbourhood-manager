var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');
var fs = require("fs");
var invitationOp = require('../../models/vicinityManager').invitation;
// var userOP = require('../../models/vicinityManager').user;


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
      send_mail(product._id, product.nameTo, product.emailTo, product.sentBy, product.type);
    }
    res.json(response);
  });

}

function send_mail(id, nameTo, emailTo, sentBy, type){ // Start send_mail

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  if (type === "newUser"){ // MAIN IF
    fs.exists("./helpers/mail/inviteUser.html", function(fileok){
      if(fileok){
        fs.readFile("./helpers/mail/inviteUser.html", function(error, data) {

          var mailContent = String(data);
          var link = "http://localhost:8000/app/#/invitation/newUser/" + id;
          mailContent = mailContent.replace("#var1",nameTo);
          mailContent = mailContent.replace("#var2",sentBy.name);
          mailContent = mailContent.replace("#var3",link);

          var mailOptions = {
            from: 'noreply.vicinity@gmail.com',
            to: emailTo,
            subject: 'Invitation email to join VICINITY',
            // text: '',
            html: mailContent,
          };

        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          };
          console.log('Message sent: ' + info.response);
        });

        });
      }
      else logger.debug("file not found");
    });
  }else{ // MAIN ELSE
    fs.exists("./helpers/mail/inviteCompany.html", function(fileok){
      if(fileok){
        fs.readFile("./helpers/mail/inviteCompany.html", function(error, data) {

          var mailContent = String(data);
          var link = "http://localhost:8000/app/#/invitation/newCompany/" + id;
          mailContent = mailContent.replace("#var1",nameTo);
          mailContent = mailContent.replace("#var2",sentBy.name);
          mailContent = mailContent.replace("#var3",link);
          mailContent = mailContent.replace("#var4",sentBy.organisation);

          var mailOptions = {
            from: 'noreply.vicinity@gmail.com',
            to: emailTo,
            subject: 'Invitation email to join VICINITY',
            // text: '',
            html: mailContent,
          };

        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          };
          console.log('Message sent: ' + info.response);
        });

        });
      }
      else logger.debug("file not found");
    });
  }; // END MAIN IF/ELSE

} // end send_mail

module.exports.postOne = postOne;
