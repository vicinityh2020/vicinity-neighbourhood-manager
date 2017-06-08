var mongoose = require('mongoose');
var mailing = require('../../helpers/mail/mailing');
var ce = require('cloneextend');
var registrationOp = require('../../models/vicinityManager').registration;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var config = require('../../configuration/configuration');
var commServerPost = require('../../helpers/commServer/post');

function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;

registrationOp.findByIdAndUpdate(o_id, {$set: updates}, { new: true }, function (err, raw) {

// Case new company registration

      if ((raw.type == "newCompany") && (raw.status == "verified")){
        var db = new userAccountOp();
        var db2 = new userOp();

        db2.name =raw.userName;
        db2.avatar= config.avatarUser;
        db2.occupation =raw.occupation;
        db2.email =raw.email;
        db2.authentication.password =raw.password;
        db2.authentication.principalRoles[0] ="user";
        db2.authentication.principalRoles[1] ="administrator";
        db2.save(function(err, product) {
          if (err) {
            response = {"error": true, "message": "Error adding data!"};
            logger.debug('Error in saving new user!');
            res.json(response);
          } else {
            logger.debug('New user was successfuly saved!');
            db.businessId = raw.businessId;
            db.organisation = raw.companyName;
            db.location = raw.companyLocation;
            db.accountOf[0] = product._id;
            db.avatar = config.avatarOrg;

            db.save(function(err, product2) {
              if (err) {
                response = {"error": true, "message": "Error adding data!"};
                logger.debug('Error in saving new userAccount!');
                res.json(response);
              } else {
                logger.debug('New userAccount was successfuly saved!');
                commServerPost.registerCompany(product2,req.headers.authorization); // Add group in commServer for given company
                response = {"error": false, "message": "New userAccount was successfuly saved!"};
                res.json(response);
              }
            });
          };
        });

// Case new user registration

        }else if ((raw.type == "newUser") && (raw.status == "verified")){
          var db2 = new userOp();
          db2.name =raw.userName;
          db2.avatar= config.avatarUser;
          db2.occupation =raw.occupation;
          db2.email =raw.email;
          db2.authentication.password =raw.password;
          db2.authentication.principalRoles[0] ="user";
          db2.save(function(err, product) {
            if (err) {
              response = {"error": true, "message": "Error adding data!"};
              logger.debug('Error in saving new user!');
              res.json(response);
            } else {
                var userAccountId = mongoose.Types.ObjectId(raw.companyId);
                userAccountOp.findById(userAccountId, function(err, data2){
                  var user_id = mongoose.Types.ObjectId(product._id);
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
        logger.debug('Wrong status, doing nothing...')
        res.json(response);
      };
   });
}

function send_mail(id, emailTo, companyName, status){

  if(status === 'pending'){
    var thisLink = "http://localhost:8000/app/#/registration/newCompany/";
    var thisTmp = "activateCompany";
    var thisSubject = 'Verification email to join VICINITY';
  }else{
    var thisLink = "";
    var thisTmp = "rejectCompany";
    var thisSubject = 'Issue in the process to join VICINITY';
  }

  var mailInfo = {
    link : thisLink + id,
    emailTo : emailTo,
    subject : thisSubject,
    tmpName : thisTmp,
    name : companyName
  }

  mailing.sendMail(mailInfo);

}

// function delIdFromHasAccessAndAccessRequestFrom(adminId, friendId){
//
//     itemOp.find({ hasAdministrator: {$in : [adminId]}, accessRequestFrom: {$in : [friendId]}},function(err, data){
//         var dev = {};
//         for (index in data){
//           dev = data[index];
//
//           for (var index2 = dev.accessRequestFrom.length - 1; index >= 0; index --) {
//               if (dev.accessRequestFrom[index2].toString() === friendId.toString()) {
//                   dev.accessRequestFrom.splice(index2, 1);
//               }
//           };
//
//           dev.save();
//         };
//     });
//
//     itemOp.find({ hasAdministrator: {$in : [adminId]}, hasAccess: {$in : [friendId]}},function(err, data){
//         var dev = {};
//         for (index in data){
//           dev = data[index];
//
//           for (var index2 = dev.hasAccess.length - 1; index >= 0; index --) {
//               if (dev.hasAccess[index2].toString() === friendId.toString()) {
//                   dev.hasAccess.splice(index2, 1);
//               }
//           };
//
//           dev.save();
//         };
//     });
//
// }



module.exports.putOne = putOne;
// module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
