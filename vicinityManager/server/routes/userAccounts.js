var express = require('express');
var router = express.Router();

var friending = require('./userAccounts/friending');
var userProfile = require('./userAccounts/userprofile');
var configuration = require('./userAccounts/configuration');

router
  /*
    Get and update company profile
  */
  // Get the profile of the user account (Filtered or unfiltered)
  .get('/:id/organisations', userProfile.getAllFiltered)
  .get('/:id', userProfile.get)
  // update of the user account profile
  .put('/:id', userProfile.update)

  /*
    Deal with userAccount friendships
  */
  // Send friendship request to :id by autenticated user
  .post('/:id/friendship/request', friending.processFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .post('/:id/friendship/accept', friending.acceptFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .post('/:id/friendship/reject', friending.rejectFriendRequest)

  // Send friendship request approval to :id from authenticated user
  .post('/:id/friendship/cancelRequest', friending.cancelFriendRequest)

  .post('/:id/friendship/cancel', friending.cancelFriendship)

  /*
    Deal with userAccount configuration
  */
  .get('/:id/configuration', configuration.get)

  .put('/:id/configuration', configuration.put)

  .post('/:id/remove', configuration.remove);

// Export functions
module.exports = router;
