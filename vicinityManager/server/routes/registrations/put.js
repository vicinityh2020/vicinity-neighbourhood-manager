var mongoose = require('mongoose');
var mailing = require('../../helpers/mail/mailing');
var ce = require('cloneextend');
var registrationOp = require('../../models/vicinityManager').registration;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var config = require('../../configuration/configuration');
var commServer = require('../../helpers/commServer/request');


function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var db = new userAccountOp();
  var db2 = new userOp();

registrationOp.findByIdAndUpdate(o_id, {$set: updates}, { new: true }, function (err, raw) {

// Case new company registration

  if ((raw.type == "newCompany") && (raw.status == "verified")){
    db2.name =raw.userName;
    db2.avatar= config.avatarUser;
    db2.occupation =raw.occupation;
    db2.email =raw.email;
    db2.authentication.password =raw.password;
    db2.authentication.principalRoles[0] ="user";
    db2.authentication.principalRoles[1] ="administrator";
    db2.save(function(err, userData) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
        logger.debug('Error in saving new user!');
        res.json(response);
      } else {
        logger.debug('New user was successfuly saved!');
        db.businessId = raw.businessId;
        db.organisation = raw.companyName;
        db.location = raw.companyLocation;
        db.accountOf[0] = userData._id;
        db.avatar = config.avatarOrg;

        db.save(function(err, orgData) {
          if (err) {
            response = {"error": true, "message": "Error adding data!"};
            logger.debug('Error in saving new userAccount!');
            res.json(response);
          } else {
            userData.organisation = orgData._id; // Adding the company id to the new user
            userData.save();

            createOrganisationGroups(orgData,req.headers.authorization); // Creates necessary groups in comm server

            logger.debug('New userAccount was successfuly saved!');
            response = {"error": false, "message": "New userAccount was successfuly saved!"};
            res.json(response);
          }
        });
      }
    });

// Case new user registration

        }else if ((raw.type == "newUser") && (raw.status == "verified")){
          db2.name =raw.userName;
          db2.avatar= config.avatarUser;
          db2.occupation =raw.occupation;
          db2.email =raw.email;
          db2.authentication.password =raw.password;
          db2.authentication.principalRoles[0] ="user";
          db2.organisation = mongoose.Types.ObjectId(raw.companyId);
          db2.save(function(err, userData) {
            if (err) {
              response = {"error": true, "message": "Error adding data!"};
              logger.debug('Error in saving new user!');
              res.json(response);
            } else {
                var userAccountId = mongoose.Types.ObjectId(raw.companyId);
                userAccountOp.findById(userAccountId, function(err, data2){
                  var user_id = mongoose.Types.ObjectId(userData._id);
                  if (err) {
                    response = {"error": true, "message": "Error fetching data"};
                    logger.debug('Error in saving new user!');
                  } else {
                    data2.accountOf.push(user_id);
                    data2.save();
                    response = {"error": false, "message": "User was saved to the accountOf!"};
                    logger.debug('New user was successfuly saved!');
                  }
                  res.json(response);
                });

                response = {"error": false, "message": "New user saved successfuly!"};
            }
          });

// Case we just want to send verification mail

      }else if ((raw.type == "newCompany") && (raw.status == "pending")){
        send_mail(raw._id,raw.email,raw.companyName, raw.status);
        response = {"error": false, "message": "Verification mail sent!"};
        res.json(response);

// Case we do not want that company to be registered

      }else if ((raw.type == "newCompany") && (raw.status == "declined")){
        send_mail(raw._id,raw.email,raw.companyName, raw.status);
        response = {"error": false, "message": "Verification mail sent!"};
        res.json(response);

// Otherwise ...

      }else{
        response = {"error": false, "message": "Type is neither newUser nor newCompany!"};
        logger.debug('Wrong status, doing nothing...');
        res.json(response);
      }
   });
}


// Functions supporting registration process ===================

// Main function for creating comm server groups
function createOrganisationGroups(data,auth){
  var names = ['_ownDevices', '_agents', '_foreignDevices'];
  var payload = {
    name: data._id + names[0],
    description: data.organisation
  };
  commServer.callCommServer(payload, 'groups', 'POST', auth)
    .then(callbackNext(data, auth, payload, names[1]),errorCallback1)
    .then(callbackNext(data, auth, payload, names[2]),errorCallback1);
}

// Creates new organisation groups in the comm server
function callbackNext(data, auth, payload, n){
  payload.name = data._id + n;
  return commServer.callCommServer(payload, 'groups', 'POST', auth);
}

// Error handling
function errorCallback1(err){
  //TODO delete org on error
  logger.debug('error: ' + err);
}

// Prepares an object with the necessary info to prepare a mail. The mail is then sent
// using the mailing service created under helpers
function send_mail(id, emailTo, companyName, status){
  var thisLink;
  var thisTmp;
  var thisSubject;

  if(status === 'pending'){
    thisLink = "http://localhost:8000/app/#/registration/newCompany/";
    thisTmp = "activateCompany";
    thisSubject = 'Verification email to join VICINITY';
  }else{
    thisLink = "";
    thisTmp = "rejectCompany";
    thisSubject = 'Issue in the process to join VICINITY';
  }

  var mailInfo = {
    link : thisLink + id,
    emailTo : emailTo,
    subject : thisSubject,
    tmpName : thisTmp,
    name : companyName
  };

  mailing.sendMail(mailInfo);
}


module.exports.putOne = putOne;
