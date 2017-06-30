var express = require('express');
var router = express.Router();
var getHelper = require('../helpers/search/get.js');

  router
    .get('/organisation', getHelper.searchOrganisation)
    .get('/user', getHelper.searchUser)
    .post('/item/:cid', getHelper.searchItem);

module.exports = router;
