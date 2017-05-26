var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');
var fs = require("fs");
var logger = require("../../middlewares/logger");
var registrationOp = require('../../models/vicinityManager').registration;
var notificationOp = require('../../models/vicinityManager').notification;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;


function postOne(req, res, next) {
  var db = new registrationOp();
  var dbNotif = new notificationOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;

if(!req.body.status || req.body.status !== 'pending'){

  // db.invitationId = req.body.invitationId;
  db.userName = req.body.userName;
  db.email = req.body.email;
  db.password = req.body.password;
  db.occupation = req.body.occupation;
  db.companyName = req.body.companyName;
  db.companyLocation = req.body.companyLocation;
  db.companyId = ce.clone(req.body.companyId);
  db.status = "open";
  db.businessId = req.body.businessId;
  db.termsAndConditions = req.body.termsAndConditions;
  db.type = req.body.type;

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      dbNotif.sentByReg = product._id;
      dbNotif.type = "registrationRequest";
      dbNotif.status = "waiting";
      dbNotif.isUnread = true;
      dbNotif.save(function(err,data){
        if(err){logger.debug("Error creating the notification");}
      });
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });
  } else {
    db.userName = req.body.userName;
    db.email = req.body.email;
    db.password = req.body.password;
    db.occupation = req.body.occupation;
    db.companyName = req.body.companyName;
    db.companyLocation = req.body.companyLocation;
    db.companyId = ce.clone(req.body.companyId);
    db.status = req.body.status;
    db.businessId = req.body.businessId;
    db.termsAndConditions = req.body.termsAndConditions;
    db.type = req.body.type;

    db.save(function(err, product) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
      } else {
        // dbNotif.sentByReg = product._id;
        // dbNotif.type = "registrationRequest";
        // dbNotif.status = "waiting";
        // dbNotif.isUnread = true;
        // dbNotif.save(function(err,data){
        //   if(err){logger.debug("Error creating the notification");}
        // });
        send_mail(product._id,product.userName,product.email,product.type,product.companyName);
        response = {"error": false, "message": "Data added!"};
        res.json(response);
      };
    });
  };
}


// Looking for duplicates in company registration =========

function findDuplicatesCompany(req, res, next) {

  var response = {};

  var companyName = req.body.companyName;
  var bid = req.body.businessID;
  var query = {
    $or:[
        {"organisation":companyName},
        {"businessID":bid},
        ]
      }
  userAccountOp.find(query, function(err, data) {
    logger.debug("data: " + data);
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
      res.json(response);
    } else {
      response = {"error": false, "message": data};
      res.json(response);
    }
  });
}

// Looking for duplicates in user registration =======

function findDuplicatesUser(req, res, next) {

  var response = {};
  var email = req.body.email;

  userOp.find({"email":email}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
      res.json(response);
    } else {
      response = {"error": false, "message": data};
      res.json(response);
    }
  });
}

// Verification mail for invited users =========

function send_mail(id, name, emailTo, type, companyName, status){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  if(type === 'newUser'){

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
    // NewCompany
  }else{
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

  }

}

module.exports.postOne = postOne;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
