var express = require('express');
var router = express.Router();

var getHelper = require('./audit/get.js');
var putHelper = require('./audit/put.js');

router
  .get('/:id', getHelper.getAudit)
  .put('/:id', putHelper.putAudit);

module.exports = router;
