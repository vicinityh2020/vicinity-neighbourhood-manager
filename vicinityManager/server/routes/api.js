var express = require('express');
var router = express.Router();

var apiController = require('../controllers/api/api.js');

router
//Authenticate
  .post('/authenticate', apiController.authenticate)
//Organisation
  .get('/organisation/:id/friends', apiController.getFriends)
  .get('/organisation/:id/users', apiController.getUsers)
  .get('/organisation/:id/devices', apiController.getDevices)
  .get('/organisation/:id/services', apiController.getServices)
  .post('/organisation', apiController.createOrganisation)
  .delete('/organisation', apiController.removeOrganisation)
//Users
  .get('/users/:id', apiController.getUser)
  .get('/users/:id/items', apiController.getUserItems)
  .post('/users/', apiController.createUser)
  .put('/users/:id', apiController.updateUser) // enable: true or false; Let other updates?
  .put('/users/:id/enabled', apiController.enableItem)
  .delete('/users/:id', apiController.removeUser)
//Items
  .get('/items/:id', apiController.getItem)
  .post('/items', apiController.createItem)
  .put('/items', apiController.updateItem)
  .delete('/items/:id', apiController.removeItem)
//Agents
  .get('/agents/:id/items', apiController.getAgentUsers)
  .post('/agents/', apiController.createAgent)
  .delete('/agents/:id', apiController.removeAgent)
//Contracts
  .get('/partnership', apiController.partnershipFeeds)
  .post('/partnership', apiController.requestPartnership)
  .put('/partnership', apiController.managePartnership) // In payload --> accept, reject, cancel
//Friending
  .get('/contract', apiController.contractFeeds)
  .post('/contract', apiController.requestContract)
  .put('/contract', apiController.manageContract); // In payload --> accept, reject, cancel

module.exports = router;
