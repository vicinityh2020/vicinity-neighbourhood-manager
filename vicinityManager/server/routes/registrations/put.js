var mongoose = require('mongoose');

var registrationOp = require('../../models/vicinityManager').registration;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var winston = require('winston');

winston.level='debug';


function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var response2 = {};
  var response3 = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  registrationOp.update({ "_id": o_id}, {$set: updates}, function(err, data){


    registrationOp.findById(o_id, function(err, raw){

      if ((raw.type == "newCompany") && (raw.status == "verified")){
        var db = new userAccountOp();
        var db2 = new userOp();

        db2.name =raw.userName;
        db2.occupation =raw.occupation;
        db2.email =raw.email;
        db2.authentication.password =raw.password;
        db2.authentication.principalRoles[0] ="user";
        db2.authentication.principalRoles[1] ="administrator";
        db2.save(function(err, product) {
          if (err) {
            response = {"error": true, "message": "Error adding data!"};
            winston.log('debug','Error in saving new user!');
            res.json(response);
          } else {
            winston.log('debug','New user was successfuly saved!');
            db.organisation = raw.companyName;
            db.location = raw.companyLocation;
            db.accountOf[0] = product._id;
            //var product_id = mongoose.Types.ObjectId(product._id);
            //??? db.accountOf.push(product_id);
            db.save(function(err, product2) {
              if (err) {
                response = {"error": true, "message": "Error adding data!"};
                winston.log('debug','Error in saving new userAccount!');
                res.json(response);
              } else {
                winston.log('debug','New userAccount was successfuly saved!');
                response = {"error": false, "message": "New userAccount was successfuly saved!"};
                res.json(response);
              }
            });
          };
        });

      }else if ((raw.type == "newUser") && (raw.status == "verified")){
        var db2 = new userOp();
        db2.name =raw.username ;
        db2.occupation =raw.occupation;
        db2.email =raw.email;
        db2.authentication.password =raw.password;
        db2.authentication.principalRoles[0] ="user";
        db2.save(function(err, product) {
          if (err) {
            response = {"error": true, "message": "Error adding data!"};
            winston.log('debug','Error in saving new user!');
            res.json(response);
          } else {
              var userAccountId = mongoose.Types.ObjectId(raw.companyId);

              userAccountOp.findById(userAccountId, function(err, data2){
                var user_id = mongoose.Types.ObjectId(product._id);
                if (err) {
                  response = {"error": true, "message": "Error fetching data"};

                } else {
                  data2.accountOf.push(user_id);
                  data2.save();
                  response = {"error": false, "message": "User was saved to the accountOf!"};
                  winston.log('debug','New user was successfuly saved!');
                }
                res.json(response);
//                res.json(response2);
              });

              response = {"error": false, "message": "New user saved successfuly!"};

          }
        });

      }else{
        response = {"error": false, "message": "Type is neither newUser nor newCompany!"};
        res.json(response);
      };

//      res.json(response3);
    });



//    response = {"error": err, "message": data};

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

module.exports.putOne = putOne;
// module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
