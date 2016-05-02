var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var friending = require('./companyAccounts/friending');
var userProfile = require('./companyAccounts/userprofile');
var postHelper = require('./items/post.js');
var devices = require('./companyAccounts/getMyDevices.js');
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
  .get('/:id/friends', friending.getFriends);

module.exports = router;
