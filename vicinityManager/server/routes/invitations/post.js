var mongoose = require('mongoose');
var nodemailer = require('nodemailer');

var invitationOp = require('../../models/vicinityManager').invitation;
// var userOP = require('../../models/vicinityManager').user;


function postOne(req, res, next) {
  var db = new invitationOp();
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

  db.emailTo = req.body.emailTo;
  db.nameTo = req.body.nameTo;
  db.sentBy = req.body.sentBy;
  db.type = req.body.type;

  // db.emailTo = 'viktor.oravec@gmail.com';
  // db.sentBy = 'Hana';
  // db.type = 'newUser';

  db.save(function(err, product) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      response = {"error": false, "message": "Data added!"};
      send_mail(product._id, product.nameTo, product.emailTo, product.sentBy, product.type);
    }
    res.json(response);
  });

}

function send_mail(id, nameTo, emailTo, sentBy, type){

  var smtpConfig = {
    service: 'Gmail',
    auth:
    { user: 'noreply.vicinity@gmail.com',
      pass: '9]hj4!gfmSa>8eA,' }
  };

  var transporter = nodemailer.createTransport(smtpConfig);

  // setup e-mail data with unicode symbols

  // var name = sentBy.name;
  // var company = sentBy.organisation;

  if (type === "newUser"){
    var mailOptions = {
      from: 'noreply.vicinity@gmail.com', // sender address
      to: emailTo, // list of receivers
      subject: 'Invitation to join VICINITY', // Subject line
      text: 'Dear '+ nameTo +', you got invitation to join VICINITY from ' + sentBy.name + '. Please, click on following link for registration: http://localhost:8000/app/#/login .', // plaintext body
      // html: '<b>Hello world 🐴</b>' // html body
    };
  }else{
    var mailOptions = {
      from: 'noreply.vicinity@gmail.com', // sender address
      to: emailTo, // list of receivers
      subject: 'Invitation to join VICINITY', // Subject line
      text: 'Dear representant of '+ nameTo +', you got invitation to join VICINITY from ' + sentBy.name + ' from ' + sentBy.organisation + '. Please, click on following link to register your company: http://localhost:8000/app/#/login .', // plaintext body
      // html: '<b>Hello world 🐴</b>' // html body
    };
  };


  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    };
    console.log('Message sent: ' + info.response);
});

}


module.exports.postOne = postOne;
