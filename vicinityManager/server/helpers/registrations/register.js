// Global objects and variables

var mongoose = require('mongoose');
var mailing = require('../../helpers/mail/mailing');
var logger = require("../../middlewares/logger");
var uuid = require('uuid'); // Unique ID RFC4122 generator
var audits = require('../../routes/audit/put');
var commServer = require('../../helpers/commServer/request');
var config = require('../../configuration/configuration');

var registrationOp = require('../../models/vicinityManager').registration;
var notificationOp = require('../../models/vicinityManager').notification;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;

// Functions

/*
Looking for duplicates in user registration
*/
function findDuplicatesUser(data, callback) {
  var email = data.email;
  userOp.find({"email":email}, function(err, data) {
    if (err) {
      callback(true, "Error fetching data");
    } else {
      if(data.length === 0){
        callback(false, false); // No duplicates
      } else {
        callback(false, true); // Duplicates found
      }
    }
  });
}

/*
Looking for duplicates in company registration
*/
function findDuplicatesCompany(data, callback) {
  var companyName = data.companyName;
  var bid = data.businessID;
  var query = {
    $or:[ {"organisation":companyName},
          {"businessID":bid} ] };
  userAccountOp.find(query, function(err, data) {
    if (err) {
      callback(true, "Error fetching data");
    } else {
      if(data.length === 0){
        callback(false, false); // No duplicates
      } else {
        callback(false, true); // Duplicates found
      }
    }
  });
}


function requestReg(data, callback) {
  var db = new registrationOp();
  var dbNotif = new notificationOp();

  db.userName = data.userName;
  db.email = data.email;
  db.password = data.password;
  db.occupation = data.occupation;
  db.companyName = data.companyName;
  db.companyLocation = data.companyLocation;
  db.companyId = data.companyId;
  db.status = (!data.status || data.status !== 'pending') ? "open" : data.status;
  db.businessId = data.businessId;
  db.termsAndConditions = data.termsAndConditions;
  db.type = data.type;

// Saving a registration pending approval
if(!data.status || data.status !== 'pending'){
    db.save()
    .then(function(product){
      dbNotif.sentByReg = product._id;
      dbNotif.type = 1;
      dbNotif.status = "waiting";
      dbNotif.isUnread = true;
      return dbNotif.save();
    })
    .then(function(response){
      callback(false, "Registration request created");
    })
    .catch(function(err){
      callback(true, err);
    });

// Saving a resgistration ready to send mail to requester (Invited by other org)
  } else {
    db.save()
    .then(function(product){
      var mailInfo;
      if(product.type === 'newUser'){
        mailInfo = {
          link : "http://vicinity.bavenir.eu/#/registration/newUser/" + product._id,
          tmpName : "activateUser",
          name : product.userName,
          subject : 'Verification email to join VICINITY',
          emailTo : product.email
        };
      }else{
        mailInfo = {
          link : "http://vicinity.bavenir.eu/#/registration/newCompany/" + product._id,
          tmpName : "activateCompany",
          name : product.companyName,
          subject : 'Verification email to join VICINITY',
          emailTo : product.email
        };
      }
      return mailing.sendMail(mailInfo);
    })
    .then(function(response){
      callback(false, "Registration mail sent!");
    })
    .catch(function(err){
      callback(true, err);
    });
  }
}

/*
Receives a registration update request,
based on type and status different actions can be done:
Add new organisation - Creates userAccount and User Admin in MONGO
Add new user - Create user in MONGO
Send verification or rejection mail to new Organisation
*/
function createReg(id, data, callback) {
  var o_id = mongoose.Types.ObjectId(id);
  var dbOrg = new userAccountOp();
  var dbUser = new userOp();
  var mailInfo = {};

registrationOp.findByIdAndUpdate(o_id, {$set: data}, { new: true }, function (err, raw) {

// User data
  dbUser.name =raw.userName;
  dbUser.avatar= config.avatarUser;
  dbUser.occupation =raw.occupation;
  dbUser.email =raw.email;
  dbUser.authentication.password =raw.password;
  dbUser.authentication.principalRoles[0] ="user";

// Case new company registration

  if ((raw.type == "newCompany") && (raw.status == "verified")){
    dbUser.authentication.principalRoles[1] ="administrator"; // First or user always is admin
    dbUser.save()
    .then(function(response){
      var userData = response;
      logger.debug('New user was successfuly saved!');
      dbOrg.businessId = raw.businessId;
      dbOrg.name = raw.companyName;
      dbOrg.location = raw.companyLocation;
      dbOrg.accountOf[0] = { id: userData._id, extid: userData.email};
      dbOrg.avatar = config.avatarOrg;
      dbOrg.cid = uuid();
      return dbOrg.save();
      })
    .then(function(response) {
      var orgData = response;
      userData.cid = {id: orgData._id, extid: orgData.cid}; // Adding the company id to the new user
      return userData.save();
    })
    .then(function(response){
      return audits.putAuditInt(
        orgData._id,
        { orgOrigin: {id: orgData._id, extid: orgData.cid},
          user: userData.email,
          eventType: 1 }
        );
      })
      .then(function(response){
        var payload = {
          name: orgData.cid + '_ownDevices',
          description: orgData.name
        };
        return commServer.callCommServer(payload, 'groups', 'POST'); // Creates org group in commServer
      })
      .then(function(response){
        logger.audit({user: userData.email, action: 'createOrganisation', item: orgData._id });
        callback(false, "New userAccount was successfuly saved!");
      })
      .catch(function(err){
        logger.error({user: raw.email, action: 'createOrganisation', message: err});
        callback(true, err);
      });

// Case new user registration

        }else if ((raw.type == "newUser") && (raw.status == "verified")){
        dbUser.save()
        .then(function(response){
          var userData = response;
          var userAccountId = mongoose.Types.ObjectId(raw.companyId);
          return audits.putAuditInt(
            raw.companyId,
            { orgOrigin: raw.companyId,
              user: userData.email,
              auxConnection: {kind: 'user', item: userData._id},
              eventType: 11 });
          })
          .then(function(response){
            return userAccountOp.findById(userAccountId);
          })
          .then(function(response){ // add user to organisation list of accounts
            var orgData = response;
            var user_id = { id: mongoose.Types.ObjectId(userData._id), extid: userData.email};
            orgData.accountOf.push(user_id);
            return orgData.save();
          })
          .then(function(response){ // add organisation cid schema to user
            userData.cid = {id: mongoose.Types.ObjectId(raw.companyId), extid: orgData.cid};
            return userData.save();
          })
          .then(function(response){
            callback(false, "User was saved to the accountOf!");
            logger.debug('New user was successfuly saved!');
          })
          .catch(function(err){
            logger.error({user: raw.email, action: 'createUser', message: err});
            callback(true, err);
          });

// Case we just want to send verification mail

      }else if ((raw.type == "newCompany") && (raw.status == "pending")){
        mailInfo = {
          link : "http://vicinity.bavenir.eu/#/registration/newCompany/" + raw._id ,
          tmpName : "activateCompany", name : raw.companyName,
          subject : "Verification email to join VICINITY", emailTo : raw.email
        };
        mailing.sendMail(mailInfo)
        .then(function(response){
          return notificationAPI.changeNotificationStatus("", "", 1, {sentByReg: raw._id});
        })
        .then(function(response){
          callback(false, "Verification mail sent");
        })
        .catch(function(err){
          callback(true, err);
        });

// Case we do not want that company to be registered

      }else if ((raw.type == "newCompany") && (raw.status == "declined")){
        mailInfo = {
          link : "", tmpName : "rejectCompany", name : raw.companyName,
          subject : "Issue in the process to join VICINITY", emailTo : raw.email
        };
        mailing.sendMail(mailInfo)
        .then(function(response){
          return notificationAPI.changeNotificationStatus("", "", 1, {sentByReg: raw._id});
        })
        .then(function(response){
          callback(false, "Rejection mail sent");
        })
        .catch(function(err){
          callback(true, err);
        });

// Otherwise ...

      }else{
        logger.debug('Wrong status, doing nothing...');
        callback(false, "Type is neither newUser nor newCompany!");
      }
   });
}

// Export functions

module.exports.createReg = createReg;
module.exports.requestReg = requestReg;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
