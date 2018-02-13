var express = require('express');
var router = express.Router();

var getHelper = require('../controllers/audit/get.js');
var putHelper = require('../controllers/audit/put.js');

router
  .get('/:id', getHelper.getAudit)
  .put('/:id', putHelper.putAuditExt);

module.exports = router;
