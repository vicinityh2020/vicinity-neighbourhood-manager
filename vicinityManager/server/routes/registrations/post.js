var mongoose = require('mongoose');
var mailing = require('../../helpers/mail/mailing');
var ce = require('cloneextend');
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
      //logger.debug("Error notif");
      response = {"error": true, "message": "Error adding data!"};
    } else {
      dbNotif.sentByReg = product._id;
      dbNotif.type = "registrationRequest";
      dbNotif.status = "waiting";
      dbNotif.isUnread = true;
      dbNotif.save(function(err,data){
        if(err){logger.debug("Error creating the notification");}
      });
      //logger.debug("Success notif");
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

        if(product.type === 'newUser'){
          var thisLink = "http://localhost:8000/app/#/registration/newUser/" ;
          var thisTmp = "activateUser";
          var thisName = product.userName;
        }else{
          var thisLink = "http://localhost:8000/app/#/registration/newCompany/";
          var thisTmp = "activateCompany";
          var thisName = product.companyName;
        }

        var mailInfo = {
          link : thisLink + product._id,
          emailTo : product.email,
          subject : 'Verification email to join VICINITY',
          tmpName : thisTmp,
          name : thisName
        }

        mailing.sendMail(mailInfo);

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

module.exports.postOne = postOne;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
