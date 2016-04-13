var espress = require('express');
var router = require('express').Router();
var mongoose = require('mongoose');
var getHelper = require('../helpers/gateways/get.js');
var postOneHelper = require('../helpers/gateways/post.js');
var putHelper = require('../helpers/gateways/put.js');
var deleteHelper = require('../helpers/gateways/delete.js');

var gatewayOp = require('../models/vicinityManager').gateway;

router
  .get('/', getHelper.getAll)
  .post('/', postOneHelper.postOne)
  .get('/:id', getHelper.getOne)
  .put('/:id', putHelper.putOne)
  .delete('/:id', deleteHelper.deleteOne);

module.exports = router;
