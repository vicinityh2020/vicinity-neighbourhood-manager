var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var deleteHelper = require('./items/delete.js');
var putHelper = require('./items/put.js');
var getHelper = require('./items/get.js');
var postHelper = require('./items/post.js');

var itemOp = require('../models/vicinityManager').item;

router
  .get('/', getHelper.getAll)
  .post('/', postHelper.postOne)
  .get('/:id', getHelper.getOne)
  .put('/:id', putHelper.putOne)
  .delete('/:id', deleteHelper.deleteOne);

module.exports = router;
