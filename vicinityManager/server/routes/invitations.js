var express = require('express');
var router = express.Router();

var postHelper = require('./invitations/post.js');
var getHelper = require('./invitations/get.js');

router

  .post('/', postHelper.postOne)
  .get('/', getHelper.getAll)
  .get('/:id', getHelper.getOne);

module.exports = router;
