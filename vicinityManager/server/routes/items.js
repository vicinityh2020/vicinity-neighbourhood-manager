var express = require('express');
var router = express.Router();

var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var deleteHelper = require('./items/delete.js');
var contractHelper = require('./items/contracts.js');

router
// When we receive item id to process some action over it
  .get('/:id', getHelper.getItemWithAdd)
  .put('/', putHelper.putOne)
  .post('/delete/:id', deleteHelper.deleteOne)

// Contract and item sharing
  .get('/contract/:id', contractHelper.fetchContract)
  .post('/contract', contractHelper.createContract)
  .put('/contract/:id/accept', contractHelper.acceptContract)
  .put('/contract/:id/modify', contractHelper.modifyContract)
  .delete('/contract/:id', contractHelper.removeContract)

// When userAccount requires devices/services
  .get('/:cid/organisation/myItems', getHelper.getMyItems)
  .post('/:cid/organisation/allItems', getHelper.getAllItems)
  .post('/user', getHelper.getUserItems);

module.exports = router;
