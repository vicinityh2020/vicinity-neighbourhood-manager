var express = require('express');
var router = express.Router();

var devOps = require('./devOps/devOps.js');

router
  .get('/', devOps.getAll)
  .post('/', devOps.postOne)

module.exports = router;
