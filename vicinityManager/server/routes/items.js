var express = require('express');
var router = express.Router();

var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var deviceAccess = require('./items/processDeviceAccess.js');
var cancelRequest = require('./items/cancelDeviceRequest.js');
var acceptRequest = require('./items/acceptDeviceRequest.js');
var rejectRequest = require('./items/rejectDeviceRequest.js');
var cancelAccess = require('./items/cancelAccess.js');
// var getAccess = require('./items/getAccess.js');
// var addHasAccess = require('./items/addHasAccess.js');
// var postHelper = require('./items/post.js');
// var deleteHelper = require('./items/delete.js');

router
  .get('/:id', getHelper.getItemWithAdd)
  .put('/:id', putHelper.putOne)
  .put('/:id/access', deviceAccess.processDeviceAccess)
  .put('/:id/access/cancelRequest', cancelRequest.cancelDeviceRequest)
  .put('/:id/access/accept', acceptRequest.acceptDeviceRequest)
  .put('/:id/access/reject', rejectRequest.rejectDeviceRequest)
  .put('/:id/access/cancel', cancelAccess.cancelAccess)
// When userAccount requires devices
  .get('/:id/organisation/devices', getHelper.getMyDevices)
  // .get('/:id/organisation/neighbourhood', getHelper.getNeighbourhood)
  .get('/:id/organisation/allDevices', getHelper.getAllDevices);
  // .delete('/:id', deleteHelper.deleteOne)
  // .post('/', postHelper.postOne)
  // .put('/:id/access/get', getAccess.getAccess)
  // .get('/', getHelper.getAll)
  // .get('/:id', getHelper.getOne)
  // .put('/:id/hasAccess',addHasAccess.addFriendToHasAccess);

module.exports = router;
