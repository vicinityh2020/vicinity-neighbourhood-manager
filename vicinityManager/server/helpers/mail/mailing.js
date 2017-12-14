
// Global objects

var nodemailer = require('nodemailer');
var fs = require("fs");
var logger = require("../../middlewares/logger");

// Functions

/*
Mailing service
When invoked needs to receive an object with the mail fields
*/
function sendMail(mailInfo){

  var smtpConfig = {

    host: 'vicinity.bavenir.eu',
    auth:
    { user: 'vicinitymailservice',
      pass: '1nTer0Per4bilit715h3r3' }
    };

  var transporter = nodemailer.createTransport(smtpConfig);

    fs.exists( __dirname + "/" + mailInfo.tmpName + ".html", function(isFile){
      if(isFile){
        fs.readFile( __dirname + "/" + mailInfo.tmpName + ".html", function(error, data) {

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
              logger.debug(error);
            } else {
            logger.debug('Message sent: ' + info.response);
            }
	  }
	);
      });
    }
    else logger.debug("file not found");
  });
}

module.exports.sendMail = sendMail;
