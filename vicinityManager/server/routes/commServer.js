var express = require('express');
var router = express.Router();

var registrationPost = require('../helpers/commServer/registration');
var searchPost = require('../helpers/commServer/search');
var deleteHelper = require('../helpers/commServer/delete');

// Endpoints accessible from the commServer

router
  .post('/registration', registrationPost.postRegistration)
  .post('/search', searchPost.postSearch)
  .post('/deleteItems', deleteHelper.deleteItems)
  .delete('/deleteAgent/:adid', deleteHelper.deleteAgent);

module.exports = router;
