var express = require('express');
var router = express.Router();
var logger = require("../middlewares/logger");

var getHelper = require('./nodes/get.js');
var postHelper = require('./nodes/post.js');
var putHelper = require('./nodes/put.js');

router
  .get('/:id', getHelper.getAll)
  .get('/node/:id', getHelper.getOne)
  .post('/:id', postHelper.postOne)
  .put('/:id', putHelper.putOne);

module.exports = router;
