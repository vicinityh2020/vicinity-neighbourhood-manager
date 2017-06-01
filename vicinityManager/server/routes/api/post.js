var mongoose = require('mongoose');
var userAccountsOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;
var jwt = require('../../helpers/jwtHelper');
var moment = require('moment');
var logger = require("../../middlewares/logger");
var mailing = require('../../configuration/mail/mailing');



/* GET users listing. */
function authenticate(req, res, next) {

  var response = {};
  var userName = req.body.username;
  var password = req.body.password;

  if (userName && password) {
    userOp.find({ email: userName }, function(error, result) {
      if (error || !result || result.length !== 1){
        res.json({ success: false });
      } else {
        // var accounts = result[0].accountOf;
        // remove unnecessary accounts from results
        // for (var index = accounts.length - 1; index >= 0; index --) {
        //     if (accounts[index].email !== userName){
        //       accounts.splice(index,1);
        //     }
        // }
        if ((userName === result[0].email) && (password === result[0].authentication.password)) {

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
      };
    });
  } else {
    res.json({success: false});
  }
}


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
        link : "http://localhost:8000/app/#/authentication/recoverPassword/" + result[0]._id,
        emailTo : result[0].email,
        subject : 'Password recovery email VICINITY',
        tmpName :'recoverPwd',
        name : result[0].name
      }

      mailing.sendMail(mailInfo);

    }
  });
}

module.exports.authenticate = authenticate;
module.exports.findMail = findMail;
