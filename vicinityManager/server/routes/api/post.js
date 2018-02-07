// Global variables

var mongoose = require('mongoose');
var userAccountsOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;
var rememberOp = require('../../models/vicinityManager').remember;
var jwt = require('../../helpers/jwtHelper');
var moment = require('moment');
var logger = require("../../middlewares/logger");
var mailing = require('../../helpers/mail/mailing');
var bcrypt = require('bcrypt');

// Main functions - Login process

/* Check user and password. */
function authenticate(req, res, next) {

  var response = {};
  var userName = req.body.username;
  var userRegex = new RegExp("^" + userName.toLowerCase(), "i");
  var pwd = req.body.password;
  var saltRounds = 10;
  var salt = "";
  var hash = "";

  if (userName && password) {
    userOp.find({ email: { $regex: userRegex } }, function(error, result) {
      if (error || !result || result.length !== 1){
        res.json({ success: false });
      } else {

        bcrypt.genSalt(saltRounds)
        .then(function(response){
          salt = response;
          return bcrypt.hash(pwd, salt);
        })
        .then(function(response){
          hash = response;

          if ((userName.toLowerCase() === result[0].email.toLowerCase()) && (hash === result[0].authentication.hash)) {

              var o_id = mongoose.Types.ObjectId(result[0]._id);

              userAccountsOp.find({ accountOf: {$elemMatch: { id: o_id }}}, function(error, result2) {
              var credentials = jwt.jwtEncode(userName, result[0].authentication.principalRoles, result[0]._id, result2[0]._id);
              res.json({ success: true, message: credentials });
              logger.audit({user: userName, action: 'login'});
            });

          } else {
            logger.warn({user: userName, action: 'login', message: 'Wrong password'});
            res.json({success: false});
          }
        });

      }
    });
  } else {
    logger.warn({user: userName, action: 'login', message: 'Missing fields'});
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
