var express = require('express');
var router = express.Router();

var putHelper = require('../controllers/items/put.js');
var getHelper = require('../controllers/items/get.js');
var deleteHelper = require('../controllers/items/delete.js');
var contractHelper = require('../controllers/items/contracts.js');

router
// When we receive item id to process some action over it
  .get('/:id', getHelper.getItemWithAdd)
  .put('/', putHelper.putOne)
  .delete('/delete/:id', deleteHelper.deleteOne)

// Contract and item sharing
  .get('/contract/:id', contractHelper.fetchContract)
  .post('/contract', contractHelper.createContract)
  .post('/contract/disableItem', contractHelper.disableOneItem)
  .post('/contract/enableItem', contractHelper.enableOneItem)
  .post('/contract/removeItem', contractHelper.removeOneItem)
  .put('/contract/:id/accept', contractHelper.acceptContract)
  // .put('/contract/:id/modify', contractHelper.modifyContract)
  .delete('/contract/:id', contractHelper.removeContract)

// When userAccount requires devices/services
  .get('/count/:type', getHelper.getCount)
  .get('/:cid/organisation/myItems', getHelper.getMyItems)
  .get('/:cid/contract/:oid', getHelper.getMyContractItems)
  .post('/array', getHelper.getArrayOfItems)
  .post('/:cid/organisation/allItems', getHelper.getAllItems)
  .post('/user', getHelper.getUserItems);

module.exports = router;
