// Global variables

var mongoose = require('mongoose');
var userAccountsOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;
var rememberOp = require('../../models/vicinityManager').remember;
var jwt = require('../../helpers/jwtHelper');
var moment = require('moment');
var logger = require("../../middlewares/logger");
var mailing = require('../../helpers/mail/mailing');


// Main functions - Login process

/* Check user and password. */
function authenticate(req, res, next) {

  var response = {};
  var userName = req.body.username;
  var userRegex = new RegExp("^" + userName.toLowerCase(), "i");
  var password = req.body.password;

  if (userName && password) {
    userOp.find({ email: { $regex: userRegex } }, function(error, result) {
      if (error || !result || result.length !== 1){
        res.json({ success: false });
      } else {

        if ((userName.toLowerCase() === result[0].email.toLowerCase()) && (password === result[0].authentication.password)) {

            var o_id = mongoose.Types.ObjectId(result[0]._id);

            userAccountsOp.find({ accountOf: {$elemMatch: {$eq : o_id }}}, function(error, result2) {
            //TODO: test if exist result2
            var credentials = jwt.jwtEncode(userName, result[0].authentication.principalRoles, result[0]._id, result2[0]._id);

            response = {
              success: true,
              message: credentials
            };
            res.json(response);
          });
        } else {
          res.json({success: false});
        }
      }
    });
  } else {
    res.json({success: false});
  }
}

/* Recover password - Sends link to the provided mail */
function findMail(req, res, next) {

  var response = {};
  var userName = req.body.username;
  userOp.find({ email: userName }, function(err, result) {

    if (err || !result || result.length !== 1){
      response = {"error": true};
      res.json(response);
    } else {

      response = {"error": false, "message": result};
      res.json(response);

      var mailInfo = {
        link : "http://vicinity.bavenir.eu/#/authentication/recoverPassword/" + result[0]._id,
        emailTo : result[0].email,
        subject : 'Password recovery email VICINITY',
        tmpName :'recoverPwd',
        name : result[0].name
      };

      mailing.sendMail(mailInfo);

    }
  });
}

/* Stores cookie in MONGO for the Remember Me functionality */
function rememberCookie(req, res, next) {
  var db = new rememberOp();
  var response = {};

  db.token = req.body.token;

  db.save(function(err,data){
    if(err){
      logger.debug("Error creating the notification");
    }else{
      response = {"error": false, "message": data};
      res.json(response);
    }
  });
}

// Export functions

module.exports.authenticate = authenticate;
module.exports.findMail = findMail;
module.exports.rememberCookie = rememberCookie;
