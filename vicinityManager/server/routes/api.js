var express = require('express');
var mongoose = require('mongoose');
var userAccountsOp = require('../models/vicinityManager').userAccount;
var userOp = require('../models/vicinityManager').user;
var jwt = require('../helpers/jwtHelper');
var moment = require('moment');
var logger = require("../middlewares/logger");
var router = express.Router();
var nodemailer = require('nodemailer');
var fs = require("fs");


/* GET users listing. */
router.post('/authenticate', function(req, res, next) {

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
});


router.post('/recovery', function(req, res, next) {

  var response = {};
  var userName = req.body.username;
  userOp.find({ email: userName }, function(err, result) {

    if (err || !result || result.length !== 1){
      response = {"error": true};
      res.json(response);
    } else {

      response = {"error": false, "message": result};
      res.json(response);
      
      var smtpConfig = {
        service: 'Gmail',
        auth:
        { user: 'noreply.vicinity@gmail.com',
          pass: '9]hj4!gfmSa>8eA,' }
      };

      var transporter = nodemailer.createTransport(smtpConfig);

      fs.exists("./helpers/mail/recoverPwd.html", function(fileok){
        if(fileok){
          fs.readFile("./helpers/mail/recoverPwd.html", function(error, data) {
            var mailContent = String(data);
            var link = "http://localhost:8000/app/#/authentication/recoverPassword/" + result[0]._id;
            mailContent = mailContent.replace("#name",result[0].name);
            mailContent = mailContent.replace("#link",link);

            var mailOptions = {
              from: 'noreply.vicinity@gmail.com',
              to: result[0].email,
              subject: 'Password recovery email VICINITY',
              html: mailContent,
            };

          transporter.sendMail(mailOptions, function(error, info){
            if(error){
              return logger.debug(error);
            };
            logger.debug('Message sent: ' + info.response);
          });

          });
        }
        else logger.debug("file not found");
      });

    }
  });
});


router.put('/recovery/:id',function putOne(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  userOp.update({ "_id": o_id}, {$set: updates}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
  })
});

module.exports = router;
