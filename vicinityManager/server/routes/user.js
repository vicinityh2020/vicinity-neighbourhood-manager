var express = require('express');
var router = express.Router();
var putHelper = require('./user/put.js');
var getHelper = require('./user/get.js');
// var postHelper = require('./user/post.js');

router
  .get('/:id', getHelper.getOne)
  .get('/', getHelper.getAll)
  // .post('/', postHelper.postOne)
  .put('/:id', putHelper.putOne)

module.exports = router;
