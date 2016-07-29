var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var ce = require('cloneextend');

var registrationOp = require('../../models/vicinityManager').registration;
var invitationOp = require('../../models/vicinityManager').invitation;
// var userOP = require('../../models/vicinityManager').user;


function postOne(req, res, next) {
  var db = new registrationOp();
  var response = {};
//TODO: Request body atributes null check;
//TODO: ObjectId conversion;

  // db.name = req.body.name;
  // db.consistsOf = req.body.consistsOf;
  // db.hasAdministrator = ce.clone(req.body.hasAdministrator);
  // db.accessRequestFrom = ce.clone(req.body.accessRequestFrom);
  // db.accessLevel = req.body.accessLevel;
  // db.hasAccess = ce.clone(req.body.hasAccess);
  // db.info = ce.clone(req.body.info);
  // // db.info = {id_tag: req.body.info.id_tag, id_value: req.body.info.id_value};
  // db.color = req.body.color;
  // db.avatar = req.body.avatar;
  // // db.electricity = ce.clone(req.body.electricity);
  // db.info = ce.clone(req.body.info);

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

  // db.emailTo = 'viktor.oravec@gmail.com';
  // db.sentBy = 'Hana';
  // db.type = 'newUser';

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      //populate here?
      // var o_id = product.invitationId;
      // invitationOp.findById(o_id, function(err, data){
      //   if (err) {
      //     winston.log('debug','Error in fetching data!');
      //   } else {
      //     // product.nameTo = data.nameTo;
      //     // product.sentBy = data.sentBy;
      //     // product.type = data.type;
      //     product.invitation = data;
      //     send_mail(product._id, product.userName, product.email, product.invitation.type);
      //     // winston.log('debug', 'hallo world' + product.type);
      //   };
      //   // winston.log('debug','End getOne');
      //   // res.json(response);
      // })
      send_mail(product._id, product.userName, product.email, product.type);
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });

}

function send_mail(id, name, emailTo, type){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  if (type == "newUser"){
    var mailOptions = {
      from: 'noreply.vicinity@gmail.com',
      to: emailTo,
      subject: 'Invitation to join VICINITY',
      text: 'Dear '+ name +', to activate your Vicinity account, please click on following link: http://localhost:8000/app/#/registration/newUser/' + id + '.',
    };
  }else {
    var mailOptions = {
      from: 'noreply.vicinity@gmail.com',
      to: emailTo,
      subject: 'Invitation to join VICINITY',
      text: 'Dear representant of '+ name +', to activate your and your company account, please click on following link: http://localhost:8000/app/#/registration/newCompany/' + id + '.',
    };
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    };
    console.log('Message sent: ' + info.response);
});

}


module.exports.postOne = postOne;
