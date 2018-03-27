// Global objects and variables

var mongoose = require('mongoose');
var mailing = require('../../services/mail/mailing');
var logger = require("../../middlewares/logger");
var uuid = require('uuid'); // Unique ID RFC4122 generator
var audits = require('../../services/audit/audit');
var commServer = require('../../services/commServer/request');
var config = require('../../configuration/configuration');
var bcrypt = require('bcrypt');
var notifHelper = require('../../services/notifications/notificationsHelper');

var registrationOp = require('../../models/vicinityManager').registration;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;

// Functions

/*
Looking for duplicates in user registration
*/
function findDuplicatesUser(data) {
  var email = data.email;
  return new Promise(function(resolve, reject) {
    userOp.find({email: email}, {email:1}, function(err, output) {
      if (err) {
        reject(err);
      } else {
        if(output.length === 0){
          resolve(false); // No duplicates
        } else {
          resolve(true); // Duplicates found
        }
      }
    });
  });
}

/*
Looking for duplicates in company registration
*/
function findDuplicatesCompany(data) {
  companyName = data.companyName;
  bid = data.businessId;
  var query = {
    $or:[ {name: companyName},
          {businessId: bid} ] };
  return new Promise(function(resolve, reject) {
    userAccountOp.find(query, {cid:1}, function(err, output) {
      if (err) {
        reject(err);
      } else {
        if(output.length === 0){
          resolve(false); // No duplicates
        } else {
          resolve(true); // Duplicates found
        }
      }
    });
  });
}


function requestReg(data, callback) {
  var db = new registrationOp();
  var pwd = data.password;
  var saltRounds = 10;
  var salt = "";
  var hash = "";

  db.userName = data.userName;
  db.email = data.email;
  db.occupation = data.occupation;
  db.companyName = data.companyName;
  db.companyLocation = data.companyLocation;
  db.companyId = data.companyId; // Only when registering new user
  db.cid = data.cid; // Only when registering new user
  db.status = (!data.status || data.status !== 'pending') ? "open" : data.status;
  db.businessId = data.businessId;
  db.termsAndConditions = data.termsAndConditions;
  db.type = data.type;

// Saving a registration pending approval
if(!data.status || data.status !== 'pending'){
    bcrypt.genSalt(saltRounds)
    .then(function(response){
      salt = response.toString('hex');
      return bcrypt.hash(pwd, salt); // Stores salt & hash in the hash field
    })
    .then(function(response){
      hash = response;
      db.hash = hash;
      return db.save();
    })
    .then(function(product){
      return notifHelper.createNotification(
        { kind: 'registration', item: product._id, extid: "NA" },
        { kind: 'registration', item: product._id, extid: "NA" },
        { kind: 'registration', item: product._id, extid: "NA" },
        'waiting', 1, null);
    })
    .then(function(response){
      callback(false, "Registration request created");
    })
    .catch(function(err){
      callback(true, err);
    });

// Saving a resgistration ready to send mail to requester (Invited by other org)
  } else {
    bcrypt.genSalt(saltRounds)
    .then(function(response){
      salt = response.toString('hex');
      return bcrypt.hash(pwd, salt); // Stores salt & hash in the hash field
    })
    .then(function(response){
      hash = response;
      db.hash = hash;
      return db.save();
    })
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
  var userData = {};
  var orgData = {};
  var userAccountId = "";

registrationOp.findByIdAndUpdate(o_id, {$set: data}, { new: true }, function (err, raw) {

// User data
  dbUser.name =raw.userName;
  dbUser.avatar= config.avatarUser;
  dbUser.occupation =raw.occupation;
  dbUser.email =raw.email;
  dbUser.authentication.hash = raw.hash;
  dbUser.authentication.principalRoles[0] ="user";
  dbUser.cid = {id: raw.companyId, extid: raw.cid};

// Set related notification to responded
  notifHelper.changeNotificationStatus("", "", 1, {sentByReg: o_id});

// Case new company registration

  if ((raw.type == "newCompany") && (raw.status == "verified")){
    dbUser.authentication.principalRoles[1] ="administrator"; // First or user always is admin
    dbUser.save()
    .then(function(response){
      userData = response;
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
      orgData = response;
      userData.cid = {id: orgData._id, extid: orgData.cid}; // Adding the company id to the new user
      return userData.save();
    })
    .then(function(response){
      return audits.create(
        { kind: 'user', item: userData._id , extid: userData.email },
        { kind: 'userAccount', item: orgData._id, extid: orgData.cid },
        {  },
        1, null);
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
          userData = response;
          userAccountId = mongoose.Types.ObjectId(raw.companyId);
          return audits.create(
            { kind: 'user', item: userData._id , extid: userData.email },
            { kind: 'userAccount', item: raw.companyId, extid: raw.cid },
            {  },
            11, null);
          })
          .then(function(response){
            return userAccountOp.findById(userAccountId);
          })
          .then(function(response){ // add user to organisation list of accounts
            orgData = response;
            var user_id = {id: userData._id, extid: userData.email};
            orgData.accountOf.push(user_id);
            return orgData.save();
          })
          .then(function(response){ // add organisation cid schema to user
            userData.cid = {id: raw.companyId, extid: orgData.cid};
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
