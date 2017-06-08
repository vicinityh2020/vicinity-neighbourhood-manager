var express = require('express');
var router = express.Router();
var logger = require("../middlewares/logger");

var commServerPost = require('../helpers/commServer/post');
var commServerPut = require('../helpers/commServer/put');
var commServerGet = require('../helpers/commServer/get');
var commServerDelete = require('../helpers/commServer/delete');

router
  .get('/:endPoint', commServerGet.getResource)
  .post('/:endPoint', commServerPost.postResource)
  .put('/:endPoint', commServerPut.putResource)
  .post('/delete/:endPoint', commServerDelete.deleteResource)

module.exports = router;
