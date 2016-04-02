var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var friending = require('../helpers/userAccounts/friending');
var userProfile = require('../helpers/userAccounts/userprofile');
var userAccountOp = require('../models/vicinityManager').userAccount;

router
  .get('/', function(req, res, next) {
    var response = {};
    debugger;
    userAccountOp.find({}, function(err, data) {    
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  })
  .post('/', function(req, res, next) {
    var db = new userAccountOp();
    var response = {};
    
    db.email = req.body.email;
    db.avatar = req.body.avatar;
    db.authentication = {
      password: req.body.authentication.password,
      principalRoles: req.body.authentication.principalRoles,
    }
    
    db.creatorOf = req.body.creatorOf;
    db.follows = req.body.follows;
    db.memberOf = req.body.memberOf;
        
    db.accountOf.name = req.body.accountOf.name;
    db.accountOf.firstName = req.body.accountOf.firstName;
    db.accountOf.surname = req.body.accountOf.surname;
    db.accountOf.lastName = req.body.accountOf.lastName;
    db.accountOf.occupation = req.body.accountOf.occupation;
    db.accountOf.location = req.body.accountOf.location;
    db.accountOf.organisation = req.body.accountOf.organisation;
    
    db.knows = req.body.knows;
  
    db.modifierOf = req.body.modifierOf;
  
    db.administratorOf = req.body.administratorOf;
    
    db.badges = req.body.badges;
  
    db.notes = req.body.notes;
  
    db.save(function(err) {
      if (err) {
        response = {"error": true, "message": "Error adding data!"};
      } else {
        response = {"error": false, "message": "Data added!"};
      }
      res.json(response);
    });
  })
  // Get the profile of the user account
  .get('/:id', userProfile.get)

  // update of the user account profile
  .put('/:id', function(req, res, next) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userAccountOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    })
  })

  // remove of the user account profile
  .delete('/:id', function(req, res, next) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userAccountOp.remove({ "_id" : o_id}, function(err) {
      res.json({"error" : err});
    });
  })

  // Send friendship request to :id by autenticated user
  .post('/:id/friendship', friending.processFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .put('/:id/friendship/accept', friending.acceptFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .put('/:id/friendship/reject', friending.rejectFriendRequest)
    
  .get('/:id/friends', function(req, res, next) {
    console.log("GET /:id/friends");
    console.log(":id " + req.params.id);
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userAccountOp.findById(o_id).
      populate('knows').exec(function(err, user){
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": user.knows};
      }
      res.json(response);
    })
    });

module.exports = router;