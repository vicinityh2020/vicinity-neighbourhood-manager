var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var friending = require('../helpers/userAccounts/friending');
var userProfile = require('../helpers/userAccounts/userprofile');
var userAccountOp = require('../models/vicinityManager').userAccount;
var ce = require('cloneextend');

router
  .get('/', userProfile.getAll)
  .post('/', userProfile.create)
  // Get the profile of the user account
  .get('/:id', userProfile.get)
  // update of the user account profile
  .put('/:id', userProfile.update)
  // remove of the user account profile
  .delete('/:id', userProfile.delete)

  // Send friendship request to :id by autenticated user
  .post('/:id/friendship', friending.processFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .put('/:id/friendship/accept', friending.acceptFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .put('/:id/friendship/reject', friending.rejectFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .put('/:id/friendship/cancel', friending.cancelFriendRequest)
  .delete('/:id/friendship', friending.cancelFriendship)
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
