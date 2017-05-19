var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');
var fs = require("fs");
var logger = require("../../middlewares/logger");
var registrationOp = require('../../models/vicinityManager').registration;
// var invitationOp = require('../../models/vicinityManager').invitation;
// var userOP = require('../../models/vicinityManager').user;


function postOne(req, res, next) {
  var db = new registrationOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;


  // db.invitationId = req.body.invitationId;
  db.userName = req.body.userName;
  db.email = req.body.email;
  db.password = req.body.password;
  db.occupation = req.body.occupation;
  db.companyName = req.body.companyName;
  db.companyLocation = req.body.companyLocation;
  db.companyId = ce.clone(req.body.companyId);
  db.status = "open";
  db.type = req.body.type;
  //3 following lines through populate? somehow
  // db.nameTo = req.body.nameTo;
  // db.sentBy = req.body.sentBy;
  // db.type = req.body.type;

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      //populate here?
      // var o_id = product.invitationId;
      // invitationOp.findById(o_id, function(err, data){
      //   if (err) {
      //     winston.log('debug','Error in fetching data!');
      //   } else {
      //     // product.nameTo = data.nameTo;
      //     // product.sentBy = data.sentBy;
      //     // product.type = data.type;
      //     product.invitation = data;
      //     send_mail(product._id, product.userName, product.email, product.invitation.type);
      //     // winston.log('debug', 'hallo world' + product.type);
      //   };
      //   // winston.log('debug','End getOne');
      //   // res.json(response);
      // })
      send_mail(product._id, product.userName, product.email, product.type, product.companyName);
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });

}

function send_mail(id, name, emailTo, type, companyName){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  //TODO rework else/if and simplify the code by using functions

  if (type == "newUser"){ // MAIN IF
    fs.exists("./helpers/mail/activateUser.html", function(fileok){
      if(fileok){
        fs.readFile("./helpers/mail/activateUser.html", function(error, data) {

          var mailContent = String(data);
          var link = "http://localhost:8000/app/#/registration/newUser/" + id;
          mailContent = mailContent.replace("#name",name);
          mailContent = mailContent.replace("#link",link);

          var mailOptions = {
            from: 'noreply.vicinity@gmail.com',
            to: emailTo,
            subject: 'Verification email to join VICINITY',
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

  }else { // MAIN ELSE

    fs.exists("./helpers/mail/activateCompany.html", function(fileok){
      if(fileok){
        fs.readFile("./helpers/mail/activateCompany.html", function(error, data) {

          var mailContent = String(data);
          var link = "http://localhost:8000/app/#/registration/newCompany/" + id;
          mailContent = mailContent.replace("#companyName",companyName);
          mailContent = mailContent.replace("#link",link);

          var mailOptions = {
            from: 'noreply.vicinity@gmail.com',
            to: emailTo,
            subject: 'Verification email to join VICINITY',
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
  } // END MAIN IF/ELSE
}

module.exports.postOne = postOne;
