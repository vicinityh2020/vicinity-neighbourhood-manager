var express = require('express');
var router = express.Router();

var postHelper = require('./api/post.js');
var putHelper = require('./api/put.js');

router
  .post('/authenticate', postHelper.authenticate)
  .post('/recovery', postHelper.findMail)
  .put('/recovery/:id', putHelper.updatePwd)

module.exports = router;
