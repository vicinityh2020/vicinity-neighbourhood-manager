var express = require('express');
var router = express.Router();

var registrationPost = require('../helpers/commServer/registration');
var searchPost = require('../helpers/commServer/search');

router
  .post('/registration', registrationPost.postRegistration)
  .post('/search', searchPost.postSearch);

module.exports = router;
