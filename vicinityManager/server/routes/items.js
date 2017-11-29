var express = require('express');
var router = express.Router();

var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var itemAccess = require('./items/processItemAccess.js');
var cancelRequest = require('./items/cancelItemRequest.js');
var acceptRequest = require('./items/acceptItemRequest.js');
var rejectRequest = require('./items/rejectItemRequest.js');
var cancelAccess = require('./items/cancelItemAccess.js');
var deleteHelper = require('./items/delete.js');

router

// When we receive item id to process some action over it
  .get('/:id', getHelper.getItemWithAdd)
  .put('/:id', putHelper.putOne)
  .put('/:id/access', itemAccess.processItemAccess)
  .put('/:id/access/cancelRequest', cancelRequest.cancelItemRequest)
  .put('/:id/access/accept', acceptRequest.acceptItemRequest)
  .put('/:id/access/reject', rejectRequest.rejectItemRequest)
  .put('/:id/access/cancel', cancelAccess.cancelItemAccess)
  .post('/delete/:id', deleteHelper.deleteOne)

// When userAccount requires devices/services
  .get('/:cid/organisation/myItems', getHelper.getMyItems)
  .get('/:cid/organisation/allItems', getHelper.getAllItems);

module.exports = router;
