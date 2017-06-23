var express = require('express');
var router = express.Router();
var deleteHelper = require('./items/delete.js');
var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var postHelper = require('./items/post.js');
var deviceAccess = require('./items/processDeviceAccess.js');
var cancelRequest = require('./items/cancelDeviceRequest.js');
var acceptRequest = require('./items/acceptDeviceRequest.js');
var rejectRequest = require('./items/rejectDeviceRequest.js');
var cancelAccess = require('./items/cancelAccess.js');
var getAccess = require('./items/getAccess.js');
// var addHasAccess = require('./items/addHasAccess.js');

router
  .get('/', getHelper.getAll)
  .post('/', postHelper.postOne)
  // .get('/:id', getHelper.getOne)
  .get('/:id', getHelper.getItemWithAdd)
  .put('/:id', putHelper.putOne)
  // .put('/:id', putHelper.putOne)
  .delete('/:id', deleteHelper.deleteOne)
  .put('/:id/access', deviceAccess.processDeviceAccess)
  .put('/:id/access/cancelRequest', cancelRequest.cancelDeviceRequest)
  .put('/:id/access/accept', acceptRequest.acceptDeviceRequest)
  .put('/:id/access/reject', rejectRequest.rejectDeviceRequest)
  .put('/:id/access/cancel', cancelAccess.cancelAccess)
  .put('/:id/access/get', getAccess.getAccess);
  // .put('/:id/hasAccess',addHasAccess.addFriendToHasAccess);

module.exports = router;
