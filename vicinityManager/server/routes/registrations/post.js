var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');
var fs = require("fs");
var logger = require("../../middlewares/logger");
var registrationOp = require('../../models/vicinityManager').registration;
// var invitationOp = require('../../models/vicinityManager').invitation;
// var userOP = require('../../models/vicinityManager').user;



function postOne(req, res, next) {
  var db = new registrationOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;

// if(req.body.status && req.body.status === 'open'){

  // db.invitationId = req.body.invitationId;
  db.userName = req.body.userName;
  db.email = req.body.email;
  db.password = req.body.password;
  db.occupation = req.body.occupation;
  db.companyName = req.body.companyName;
  db.companyLocation = req.body.companyLocation;
  db.companyId = ce.clone(req.body.companyId);
  db.status = "open";
  db.type = req.body.type;
  //3 following lines through populate? somehow
  // db.nameTo = req.body.nameTo;
  // db.sentBy = req.body.sentBy;
  // db.type = req.body.type;

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });
// } else {
//     send_mail(product._id,product.userName,product.email,product.type,product.companyName);
//     response = {"error": false, "message": "Data added!"};
//     res.json(response);
// }
}

module.exports.postOne = postOne;
