var express = require('express');
var router = express.Router();

var friending = require('../controllers/userAccounts/friending');
var getOrgs = require('../controllers/userAccounts/get');
var updateOrgs = require('../controllers/userAccounts/update');
var configuration = require('../controllers/userAccounts/configuration');

router
  /*
    Get and update company profile
  */
  // Get the profile of the user account (Filtered or unfiltered)
  .get('/:id/organisations', getOrgs.getAll)
  .get('/:id', getOrgs.getOne)
  .get('/:id/cid', getOrgs.getCid)
  .put('/:id', updateOrgs.update)
  /*
    Deal with userAccount friendships
  */
  // Send friendship request to :id by autenticated user
  .post('/:id/friendship/request', friending.processFriendRequest)
  // Send friendship request approval to :id from authenticated user
  .post('/:id/friendship/accept', friending.acceptFriendRequest)
  // Send friendship request rejection to :id from authenticated user
  .post('/:id/friendship/reject', friending.rejectFriendRequest)
  // Send friendship request cancelation to :id from authenticated user
  .post('/:id/friendship/cancelRequest', friending.cancelFriendRequest)
  // Send friendship cancelation to :id from authenticated user
  .post('/:id/friendship/cancel', friending.cancelFriendship)
  /*
    Deal with userAccount configuration
  */
  .get('/:id/configuration', configuration.get)
  .put('/:id/configuration', configuration.put)
  .post('/:id/remove', configuration.remove);

// Export functions
module.exports = router;
