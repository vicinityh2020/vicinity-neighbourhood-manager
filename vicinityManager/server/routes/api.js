var express = require('express');
var router = express.Router();
var jwt = require("../middlewares/jwtauth");
var apiController = require('../controllers/api/api.js');

router
//Authenticate
  .post('/authenticate', apiController.authenticate)
//Organisation
  .get('/organisation/all', jwt, apiController.getOrganisations)
  .get('/organisation/friends', jwt, apiController.getFriends)
  .get('/organisation/:cid/users', jwt, apiController.getUsers)
  .get('/organisation/:cid/items', jwt, apiController.getItems)
  .post('/organisation', apiController.createOrganisation)
  .delete('/organisation', apiController.removeOrganisation)
//Users
  .get('/users/:uid', jwt, apiController.getUser)
  .get('/users/:cid/items/:uid', jwt, apiController.getUserItems)
  .post('/users/', jwt, apiController.createUser)
  .put('/users/:uid', apiController.updateUser) // enable: true or false; Let other updates?
  .delete('/users/:uid', jwt, apiController.removeUser)
//Items
  .get('/items/:id', apiController.getItem)
  .post('/items', apiController.createItem)
  .put('/items', apiController.updateItem)
  .delete('/items/:id', apiController.removeItem)
//Agents
  .get('/agents/:id/items', apiController.getAgentUsers)
  .post('/agents/', apiController.createAgent)
  .delete('/agents/:id', apiController.removeAgent)
//Friending
  .get('/partnership', jwt, apiController.partnershipFeeds)
  .post('/partnership', jwt, apiController.requestPartnership)
  .put('/partnership', jwt, apiController.managePartnership) // In payload --> accept, reject, cancel
//Contracts
  .get('/contract', apiController.contractFeeds)
  .post('/contract', apiController.requestContract)
  .put('/contract', apiController.manageContract) // In payload --> accept, reject, cancel
//Search
  .get('/search', apiController.searchOrgs)
  .get('/search', apiController.searchUsers)
  .get('/search', apiController.searchItems);

module.exports = router;
