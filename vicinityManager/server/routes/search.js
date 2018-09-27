var express = require('express');
var router = express.Router();
var getHelper = require('../controllers/search/get.js');

router
  .get('/organisation', getHelper.searchOrganisation)
  .get('/user', getHelper.searchUser)
  .get('/item', getHelper.searchItem)
  .get('/ontology', getHelper.getOntology);

module.exports = router;
