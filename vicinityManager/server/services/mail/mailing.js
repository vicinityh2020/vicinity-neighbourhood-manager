
// Global objects

var nodemailer = require('nodemailer');
var fs = require("fs");
var logger = require("../../middlewares/logger");
var config = require('../../configuration/configuration');

// Functions

/*
Mailing service
When invoked needs to receive an object with the mail fields
*/
function sendMail(mailInfo){
  return new Promise(function(resolve, reject) {
    var smtpConfig = {
      host: config.smtpHost,
      auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        }
      };

    var transporter = nodemailer.createTransport(smtpConfig);

    fs.exists( __dirname + "/" + mailInfo.tmpName + ".html", function(isFile){
      if(isFile){
        fs.readFile( __dirname + "/" + mailInfo.tmpName + ".html", function(error, data) {
          var mailContent = String(data);
          if(mailInfo.name){mailContent = mailContent.replace("#name", mailInfo.name);}
          if(mailInfo.organisation){mailContent = mailContent.replace("#organisation", mailInfo.organisation);}
          if(mailInfo.sentByName){mailContent = mailContent.replace("#sentByName", mailInfo.sentByName);}
          if(mailInfo.sentByOrg){mailContent = mailContent.replace("#sentByOrg", mailInfo.sentByOrg);}
          mailContent = mailContent.replace("#link", mailInfo.link);

          var mailOptions = {
            from: config.mailServer,
            to: mailInfo.emailTo,
            subject: mailInfo.subject,
            html: mailContent,
          };

          transporter.sendMail(mailOptions, function(error, info){
            if(error){
              reject(error);
            } else {
              logger.debug('Message sent: ' + info.response);
              resolve("Success");
            }
      	  });
        });
      }
      else{
        reject("Registration mail not sent, file not found");
      }
    });
  });
}

// Export functions

module.exports.sendMail = sendMail;
