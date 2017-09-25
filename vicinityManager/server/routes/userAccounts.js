var express = require('express');
var router = express.Router();

var friending = require('./userAccounts/friending');
var userProfile = require('./userAccounts/userprofile');
var notifications = require('./notifications/notifications');
var configuration = require('./userAccounts/configuration');

router
  .get('/:id/organisations', userProfile.getAllFiltered)
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

  .get('/:id/friendship/myFriends', friending.findFriends)

  .delete('/:id/friendship', friending.cancelFriendship)

  .get('/:id/notifications', notifications.getNotificationsOfUser)

  .get('/:id/readNotifications', notifications.getNotificationsOfUserRead)

  .get('/:id/configuration', configuration.get)

  .put('/:id/configuration', configuration.put);


module.exports = router;
