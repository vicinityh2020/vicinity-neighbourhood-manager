var express = require('express');
var router = express.Router();
var getHelper = require('../controllers/search/get.js');

  router
    .get('/organisation', getHelper.searchOrganisation)
    .get('/user', getHelper.searchUser)
    .get('/subclass', getHelper.searchInOntology)
    .get('/allSubclass', getHelper.searchInOntologyWithInferences)
    .post('/getOids', getHelper.getOidFromOntology)
    .post('/item/:cid', getHelper.searchItem);

module.exports = router;
