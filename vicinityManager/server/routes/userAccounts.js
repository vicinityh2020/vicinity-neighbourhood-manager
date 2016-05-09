var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var friending = require('../helpers/userAccounts/friending');
var userProfile = require('../helpers/userAccounts/userprofile');
var postHelper = require('./items/post.js');
var devices = require('./userAccounts/devices.js');
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
  .get('/:id/devices', devices.getMyDevices)
  .get('/:id/neighbourhood', devices.getNeighbourhood)
  .get('/:id/friends', function(req, res, next) {
    debugger;
    console.log("GET /:id/friends");
    console.log(":id " + req.params.id);
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    userAccountOp.findById(o_id).
      populate('knows').exec(function(err, user){

      if (req.query.sort){
        if (req.query.sort == 'ASC') {
            user.knows.sort(sortListOfFriendsASC);
        } else if (req.query.sort == 'DESC') {
            user.knows.sort(sortListOfFriendsDESC);
        }
      }

      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": user.knows};
      }

      res.json(response);
    })
  });

  function sortListOfFriendsASC(a,b){
    if (a.organisation < b.organisation) {
      return -1;
    } else if (a.organisation > b.organisation){
      return 1;
    } else {
      return 0;
    }
  }

  function sortListOfFriendsDESC(a,b){
    if (a.organisation < b.organisation) {
      return 1;
    } else if (a.organisation > b.organisation){
      return -1;
    } else {
      return 0;
    }
  }


module.exports = router;
