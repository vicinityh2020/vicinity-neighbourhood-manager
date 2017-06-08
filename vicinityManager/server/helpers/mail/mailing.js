var nodemailer = require('nodemailer');
var fs = require("fs");
var logger = require("../../middlewares/logger");

function sendMail(mailInfo){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

    fs.exists( "./helpers/mail/" + mailInfo.tmpName + ".html", function(isFile){
      if(isFile){
        fs.readFile( "./helpers/mail/" + mailInfo.tmpName + ".html", function(error, data) {

          var mailContent = String(data);
          if(mailInfo.name){mailContent = mailContent.replace("#name", mailInfo.name);}
          if(mailInfo.sentByName){mailContent = mailContent.replace("#sentByName", mailInfo.sentByName);}
          if(mailInfo.sentByOrg){mailContent = mailContent.replace("#sentByOrg", mailInfo.sentByOrg);}
          mailContent = mailContent.replace("#link", mailInfo.link);

          var mailOptions = {
            from: 'noreply.vicinity@gmail.com',
            to: mailInfo.emailTo,
            subject: mailInfo.subject,
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
}

module.exports.sendMail = sendMail;
