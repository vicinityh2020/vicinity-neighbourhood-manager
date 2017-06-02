var express = require('express');
var router = express.Router();

var postHelper = require('./api/post.js');
var putHelper = require('./api/put.js');

router
  .post('/authenticate', postHelper.authenticate)
  .post('/recovery', postHelper.findMail)
  .post('/remember', postHelper.rememberCookie)
  .put('/recovery/:id', putHelper.updatePwd)
  .put('/remember/:id', putHelper.updateCookie)

module.exports = router;
