var express = require('express');
var router = express.Router();
var jwt = require("../middlewares/jwtauth");
var apiController = require('../controllers/api/api.js');

router
//Authenticate
  .post('/authenticate', apiController.authenticate)
//Organisation
  .get('/organisation', jwt, apiController.getMyOrganisation)
  .get('/organisation/all', jwt, apiController.getOrganisations)
  .get('/organisation/friends', jwt, apiController.getFriends)
  .get('/organisation/:cid/users', jwt, apiController.getUsers)
  .get('/organisation/:cid/items', jwt, apiController.getItems)
  .post('/organisation', apiController.createOrganisation)
  .delete('/organisation', jwt, apiController.removeOrganisation)
//Users
  .get('/users', jwt, apiController.getUser)
  .get('/users/:uid', jwt, apiController.getUser)
  .get('/users/:cid/items/:uid', jwt, apiController.getUserItems)
  .post('/users/', jwt, apiController.createUser)
  .put('/users/:uid', jwt, apiController.updateUser)
  .delete('/users/:uid', jwt, apiController.removeUser)
//Items
  .get('/items/:id', jwt, apiController.getItem)
  .post('/items', jwt, apiController.createItem)
  .post('/items/validate', apiController.validateItemDescription)
  .put('/items', jwt, apiController.updateItem)
  .delete('/items/:id', jwt, apiController.removeItem)
//Agents
  .get('/agents/:id/items', jwt, apiController.getAgentItems)
  .post('/agents/', jwt, apiController.createAgent)
  .delete('/agents/:id', jwt, apiController.removeAgent)
//Friending
  .get('/partnership', jwt, apiController.partnershipFeeds)
  .post('/partnership', jwt, apiController.requestPartnership)
  .put('/partnership', jwt, apiController.managePartnership) // In payload --> accept, reject, cancel
//Contracts
  .get('/contract', jwt, apiController.contractFeeds)
  .get('/contract/:ctid/items', jwt, apiController.contractInfo)
  .post('/contract', jwt, apiController.requestContract)
  .put('/contract/:id', jwt, apiController.manageContract) // In payload --> accept, reject, cancel
//Search
  .get('/search/organisations', jwt, apiController.searchOrgs)
  .get('/search/users', jwt, apiController.searchUsers)
  .get('/search/items', jwt, apiController.searchItems);

module.exports = router;
