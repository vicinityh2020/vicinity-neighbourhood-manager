var express = require('express');
var router = express.Router();

var auditHelper = require('../controllers/audit/audit.js');

router
  .get('/:id', auditHelper.getAudit)
  .post('/:id', auditHelper.postAudit);

module.exports = router;
