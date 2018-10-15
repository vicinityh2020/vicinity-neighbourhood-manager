var express = require('express');
var router = express.Router();
var jwt = require("../middlewares/jwtauth");
var apiController = require('../controllers/api/api.js');
var apiAuth = require('../controllers/api/authenticate.js');
var apiOrgs = require('../controllers/api/organisations.js');
var apiUsers = require('../controllers/api/users.js');
var apiItems = require('../controllers/api/items.js');
var apiAgents = require('../controllers/api/agents.js');
var apiFriends = require('../controllers/api/friending.js');
var apiContracts = require('../controllers/api/contracts.js');

router
//Authenticate
  .post('/authenticate', apiAuth.authenticate)
//Organisation
  .get('/organisation', jwt, apiOrgs.getMyOrganisation)
  .get('/organisation/all', jwt, apiOrgs.getOrganisations)
  .get('/organisation/friends', jwt, apiOrgs.getFriends)
  .get('/organisation/:cid/users', jwt, apiOrgs.getUsers)
  .get('/organisation/:cid/items', jwt, apiOrgs.getItems)
  .post('/organisation', apiOrgs.createOrganisation)
  .post('/organisation/auto', jwt, apiOrgs.createOrganisationAuto)
  .delete('/organisation', jwt, apiOrgs.removeOrganisation)
//Users
  .get('/users', jwt, apiUsers.getUser)
  .get('/users/:uid', jwt, apiUsers.getUser)
  .get('/users/:cid/items/:uid', jwt, apiUsers.getUserItems)
  .post('/users/', jwt, apiUsers.createUser)
  .put('/users/:uid', jwt, apiUsers.updateUser)
  .delete('/users/:uid', jwt, apiUsers.removeUser)
//Items
  .get('/items/:id', jwt, apiItems.getItem)
  .post('/items', jwt, apiItems.createItem)
  .put('/items', jwt, apiItems.updateItem)
  .delete('/items/:id', jwt, apiItems.removeItem)
//Agents
  .get('/agents/:id/items', jwt, apiAgents.getAgentItems)
  .post('/agents/', jwt, apiAgents.createAgent)
  .delete('/agents/:id', jwt, apiAgents.removeAgent)
//Friending
  .get('/partnership', jwt, apiFriends.partnershipFeeds)
  .post('/partnership', jwt, apiFriends.requestPartnership)
  .put('/partnership', jwt, apiFriends.managePartnership) // In payload --> accept, reject, cancel
//Contracts
  .get('/contract', jwt, apiContracts.contractFeeds)
  .get('/contract/:ctid/items', jwt, apiContracts.contractInfo)
  .get('/contract/validItems/:cid/:oid', jwt, apiContracts.contractValidItems)
  .get('/contract/contractedItems/:oid', jwt, apiContracts.contractContractedItems)
  .post('/contract', jwt, apiContracts.requestContract)
  .put('/contract/:id', jwt, apiContracts.manageContract) // In payload --> accept, reject, cancel
//Search
  .get('/search/organisations', jwt, apiController.searchOrgs)
  .get('/search/users', jwt, apiController.searchUsers)
  .get('/search/items', jwt, apiController.searchItems)
// Semantic Repository
  .post('/repository/validate', apiItems.validateItemDescription)
  .get('/repository/annotations', apiItems.getAnnotations)
// Statistics
  .get('/public/statistics', apiController.getStatistics);

module.exports = router;
