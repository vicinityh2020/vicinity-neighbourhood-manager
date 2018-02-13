var express = require('express');
var router = express.Router();

var loginHelper = require('../controllers/login/login.js');

router
  .post('/authenticate', loginHelper.authenticate)
  .post('/recovery', loginHelper.findMail)
  .post('/remember', loginHelper.rememberCookie)
  .put('/recovery/:id', loginHelper.updatePwd)
  .put('/remember/:id', loginHelper.updateCookie);

module.exports = router;
