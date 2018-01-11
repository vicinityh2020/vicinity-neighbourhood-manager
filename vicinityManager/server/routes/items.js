var express = require('express');
var router = express.Router();

var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var deleteHelper = require('./items/delete.js');
var putContract = require('../helpers/contracts/put.js');
var postContract = require('../helpers/contracts/post.js');
var deleteContract = require('../helpers/contracts/delete.js');

router

// When we receive item id to process some action over it
  .get('/:id', getHelper.getItemWithAdd)
  .put('/:id', putHelper.putOne)
  .post('/delete/:id', deleteHelper.deleteOne)

// Contract and item sharing
  .post('/contract', postContract.createContract)
  .put('/contract/:id', putContract.modifyContract)
  .delete('/contract/:id', deleteContract.removeContract)

// When userAccount requires devices/services
  .get('/:cid/organisation/myItems', getHelper.getMyItems)
  .post('/:cid/organisation/allItems', getHelper.getAllItems);

module.exports = router;
