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
  .delete('/organisation', jwt, apiController.removeOrganisation)
//Users
  .get('/users/:uid', jwt, apiController.getUser)
  .get('/users/:cid/items/:uid', jwt, apiController.getUserItems)
  .post('/users/', jwt, apiController.createUser)
  .put('/users/:uid', jwt, apiController.updateUser)
  .delete('/users/:uid', jwt, apiController.removeUser)
//Items
  .get('/items/:id', apiController.getItem)
  .post('/items', apiController.createItem)
  .put('/items', apiController.updateItem)
  .delete('/items/:id', apiController.removeItem)
//Agents
  .get('/agents/:id/items', jwt, apiController.getAgentUsers)
  .post('/agents/', jwt, apiController.createAgent)
  .delete('/agents/:id', jwt, apiController.removeAgent)
//Friending
  .get('/partnership', jwt, apiController.partnershipFeeds)
  .post('/partnership', jwt, apiController.requestPartnership)
  .put('/partnership', jwt, apiController.managePartnership) // In payload --> accept, reject, cancel
//Contracts
  .get('/contract', apiController.contractFeeds)
  .post('/contract', apiController.requestContract)
  .put('/contract', apiController.manageContract) // In payload --> accept, reject, cancel
//Search
  .get('/search/organisations', jwt, apiController.searchOrgs)
  .get('/search/users', jwt, apiController.searchUsers)
  .get('/search/items', jwt, apiController.searchItems);

module.exports = router;
