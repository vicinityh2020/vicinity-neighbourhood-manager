var express = require('express');
var router = express.Router();
var logger = require("../middlewares/logger");

var commServerPost = require('../helpers/commServer/incomePost');

router
  .post('/', commServerPost.postResource)

module.exports = router;
