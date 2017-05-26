var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');
var fs = require("fs");
var registrationOp = require('../../models/vicinityManager').registration;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  // var response2 = {};
  // var response3 = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;

  registrationOp.update({ "_id": o_id}, {$set: updates}, function(err, data){

    // if(!err){

    registrationOp.findById(o_id, function(err, raw){

// Case new company registration

      if ((raw.type == "newCompany") && (raw.status == "verified")){
        var db = new userAccountOp();
        var db2 = new userOp();

        db2.name =raw.userName;
        db2.avatar= "";
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
            db.avatar = "";
            //var product_id = mongoose.Types.ObjectId(product._id);
            //??? db.accountOf.push(product_id);
            db.save(function(err, product2) {
              if (err) {
                response = {"error": true, "message": "Error adding data!"};
                logger.debug('Error in saving new userAccount!');
                res.json(response);
              } else {
                logger.debug('New userAccount was successfuly saved!');
                response = {"error": false, "message": "New userAccount was successfuly saved!"};
                res.json(response);
              }
            });
          };
        });

// Case new user registration

        }else if ((raw.type == "newUser") && (raw.status == "verified")){
          var db2 = new userOp();
          db2.name =raw.userName ;
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
        send_mail(raw._id,raw.userName,raw.email,raw.type,raw.companyName, raw.status);
        response = {"error": false, "message": "Verification mail sent!"};
        res.json(response);

// Case we do not want that company to be registered

      }else if ((raw.type == "newCompany") && (raw.status == "declined")){
        send_mail(raw._id,raw.userName,raw.email,raw.type,raw.companyName, raw.status);
        response = {"error": false, "message": "Verification mail sent!"};
        res.json(response);

// Otherwise ...

      }else{
        response = {"error": false, "message": "Type is neither newUser nor newCompany!"};
        res.json(response);
      };


    });

  // }else{
  //  response = {"error": err, "message": data};
  // }

  });
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

function send_mail(id, name, emailTo, type, companyName, status){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  if(status === 'pending'){

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

  }else{ // Reject company mail

    fs.exists("./helpers/mail/rejectCompany.html", function(fileok){
      if(fileok){
        fs.readFile("./helpers/mail/rejectCompany.html", function(error, data) {

          var mailContent = String(data);
          mailContent = mailContent.replace("#companyName",companyName);

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
          //console.log('Message sent: ' + info.response);
        });

        });
      }
      else logger.debug("file not found");
    });

  }
}

module.exports.putOne = putOne;
// module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
