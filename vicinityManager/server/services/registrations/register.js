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
        resolve(output.length > 0); // false == No duplicates
      }
    });
  });
}

/*
Looking for duplicates in company registration
*/
function findDuplicatesCompany(data) {
  companyName = data.companyName;
  // bid = data.businessId;
  // var query = {
  //   $or:[ {name: companyName},
  //         {businessId: bid} ] };
  return new Promise(function(resolve, reject) {
    userAccountOp.find({name: companyName}, {cid:1}, function(err, output) {
      if (err) {
        reject(err);
      } else {
        resolve(output.length > 0); // false == No duplicates
      }
    });
  });
}

/*
Receives a request to create registration,
Can be an already verified by the devOps request or
some external request that needs to be validated
*/
function requestReg(data, callback) {
  var pwd = data.password;
  var saltRounds = 10;
  var db = buildRegistrationObj(data);
    // Saving a registration pending approval
  if(!data.status || data.status !== 'pending'){
    getHash(saltRounds, pwd)
    .then(function(hash){
      db.hash = hash;
      return registrationPendingApproval(db);
    })
    .then(function(){
      var mailInfo = {
          link : "",
          tmpName : "notifyApprover",
          name : data.userName,
          organisation : data.companyName,
          subject : 'New registration request',
          emailTo : config.approverMail
        };
      return mailing.sendMail(mailInfo);
    })
    .then(function(response){
      callback(false, "Registration request created");
    })
    .catch(function(err){
      callback(true, err);
    });
    // Saving a registration ready to send mail to requester (Invited by other org)
  } else {
    getHash(saltRounds, pwd)
    .then(function(hash){
      db.hash = hash;
      return registrationAndVerificationMail(db);
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
  var mailInfo = {};
  var regId = mongoose.Types.ObjectId(id);

  registrationOp.findByIdAndUpdate(regId, {$set: data}, { new: true }, function (err, raw) {
  // User data
    var dbUser = buildUserObj(raw);
  // Set related notification to responded
    notifHelper.changeNotificationStatus("", "", 1, {sentByReg: regId});
  // Case new company registration
    if ((raw.type == "newCompany") && (raw.status == "verified")){
      saveOrganisation(dbUser, raw)
      .then(function(response){
        logger.audit({user: response.email, action: 'createOrganisation', item: response._id });
        callback(false, "New userAccount was successfuly saved!");
      })
      .catch(function(err){
        logger.error({user: raw.email, action: 'createOrganisation', message: err});
        callback(true, err);
      });
      // Case new user registration
    }else if ((raw.type == "newUser") && (raw.status == "verified")){
      saveUser(dbUser, raw)
      .then(function(response){
        logger.debug('New user was successfuly saved!');
        callback(false, "User was saved to the accountOf!");
      })
      .catch(function(err){
        logger.error({user: raw.email, action: 'createUser', message: err});
        callback(true, err);
      });
      // Case we just want to send verification mail
      }else if ((raw.type == "newCompany") && (raw.status == "pending")){
        mailInfo = {
          link : config.baseHref + "/#/registration/newCompany/" + raw._id ,
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

/**
* Quick registration skipping mail Verification
* Only for authorized users
* @param {Object} data.user
* @param {Object} data.organisation
*
* @return {Object} New user and org ids
*/
function fastRegistration(data, token_mail, callback){
  var saltRounds = 10;
  var dbUser = {};
  var pwd = data.user.password;
  if(!pwd || pwd.length < 5){
    callback(true, "Missing or short password...");
  } else {
    findDuplicatesCompany({ companyName: data.organisation.companyName, businessId: uuid()})
    .then(function(response){
      if(!response){ // If response false === there are no duplicates
        return getHash(saltRounds, pwd);
      } else {
        return new Promise(function(resolve, reject) { reject('duplicated'); } );
      }
    })
    .then(function(hash){
      data.user.email = uuid();
      data.user.hash = hash;
      data.organisation.auto = true;
      dbUser = buildUserObj(data.user);
      return saveOrganisation(dbUser, data.organisation);
    })
    .then(function(response){
      logger.audit({user: response.email, action: 'createOrganisation', item: response._id });
      callback(false, {result: "Success", login: response.email, uid: response.uid, cid: response._id});
    })
    .catch(function(err){
      if(err === 'duplicated'){
        logger.error({user: token_mail, action: 'createOrganisation', message: err});
        callback(true, "Company name already exists...");
      } else {
        logger.error({user: token_mail, action: 'createOrganisation', message: err});
        callback(true, err);
      }
    });
  }
}


/**
* Validate body of registration request
* @param {Object} body
* @param {Boolean} fast Fast registration yes/no
*
* @return {Object} validation errors if any
*/
function validateBody(data, fast, callback){
  var validationErrors = [];
  var error = false;
  try{
    if(fast){
      if(data.organisation.companyName == null) validationErrors.push('Missing companyName');
      if(data.user.userName == null) validationErrors.push('Missing userName');
      if(data.user.password == null) validationErrors.push('Missing password');
    } else {
      if(data.companyName == null) validationErrors.push('Missing companyName');
      if(data.userName == null) validationErrors.push('Missing userName');
      if(data.email == null) validationErrors.push('Missing email');
      if(data.password == null) validationErrors.push('Missing password');
    }
    error = validationErrors.length > 0;
    callback(error, validationErrors);
  } catch(err){
    callback(true, "Multiple validation errors: " + err);
  }
}

/*
*
* Private functions
*
*/

/* Return hashed password */
function getHash(saltRounds, pwd){
  return bcrypt.genSalt(saltRounds)
  .then(function(response){
    var salt = response.toString('hex');
    return bcrypt.hash(pwd, salt); // Stores salt & hash in the hash field
  });
}

/* Save registration and notify devOps */
function registrationPendingApproval(db){
  return db.save()
  .then(function(product){
    return notifHelper.createNotification(
      { kind: 'registration', item: product._id, extid: "NA" },
      { kind: 'registration', item: product._id, extid: "NA" },
      { kind: 'registration', item: product._id, extid: "NA" },
      'waiting', 1, null);
  });
}

/* Save registration and send verification mail */
function registrationAndVerificationMail(db){
  return db.save()
  .then(function(product){
    var mailInfo = {};
    if(product.type === 'newUser'){
      mailInfo = {
        link : config.baseHref + "/#/registration/newUser/" + product._id,
        tmpName : "activateUser",
        name : product.userName,
        subject : 'Verification email to join VICINITY',
        emailTo : product.email
      };
    }else{
      mailInfo = {
        link : config.baseHref + "/#/registration/newCompany/" + product._id,
        tmpName : "activateCompany",
        name : product.companyName,
        subject : 'Verification email to join VICINITY',
        emailTo : product.email
      };
    }
    return mailing.sendMail(mailInfo);
  });
}

/* Save organisation and finish registration */
function saveOrganisation(dbUser, raw){
  var userData = {};
  var orgData = {};
  dbUser.authentication.principalRoles[1] = "administrator"; // First or user always is admin
  return dbUser.save()
  .then(function(response){
    userData = response;
    logger.debug('New user was successfuly saved!');
    var dbOrg = buildUserAccountObj(raw, userData);
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
      var payload = {
        name: orgData.cid + '_agents',
        description: orgData.name + ' agents'
      };
      return commServer.callCommServer(payload, 'groups', 'POST'); // Creates org group in commServer
    })
    .then(function(response){
      return {email: userData.email, uid: userData._id, _id: orgData._id};
    });
}

/* Save user and finish registration */
function saveUser(dbUser, raw){
  var userData = {};
  var orgData = {};
  var userAccountId = "";
  return dbUser.save()
  .then(function(response){
    userData = response;
    userAccountId = mongoose.Types.ObjectId(raw.companyId);
    return audits.create(
      { kind: 'user', item: userData._id , extid: userData.email },
      { kind: 'userAccount', item: raw.companyId, extid: raw.cid },
      {  }, 11, null
    );
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
  });
}

/* Prepare the registration object with the user input */
function buildRegistrationObj(data){
  var db = new registrationOp();
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
  return db;
}

/* Prepare the user object with the user input */
function buildUserObj(data){
  var dbUser = new userOp();
  dbUser.name = data.userName;
  dbUser.avatar= config.avatarUser;
  dbUser.occupation = data.occupation;
  dbUser.email = data.email;
  dbUser.contactMail = data.contactMail !== undefined ? data.contactMail : data.email ;
  dbUser.authentication.hash = data.hash;
  dbUser.authentication.principalRoles[0] = "user";
  return dbUser;
}

/* Prepare the userAccount object with the user input */
function buildUserAccountObj(data, userData){
  var dbOrg = new userAccountOp();
  dbOrg.businessId = data.businessId !== undefined ? data.businessId : uuid();
  dbOrg.auto = data.auto !== undefined ? data.auto : false;
  dbOrg.name = data.companyName;
  dbOrg.location = data.companyLocation;
  dbOrg.accountOf[0] = { id: userData._id, extid: userData.email};
  dbOrg.avatar = config.avatarOrg;
  dbOrg.cid = uuid();
  return dbOrg;
}

// Export functions

module.exports.createReg = createReg;
module.exports.requestReg = requestReg;
module.exports.fastRegistration = fastRegistration;
module.exports.findDuplicatesUser = findDuplicatesUser;
module.exports.findDuplicatesCompany = findDuplicatesCompany;
module.exports.validateBody = validateBody;
