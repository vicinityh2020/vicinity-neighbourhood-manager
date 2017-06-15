var express = require('express');
var router = express.Router();
var logger = require("../middlewares/logger");

var commServerPost = require('../helpers/commServer/request');
// var commServerPut = require('../helpers/commServer/put');
// var commServerGet = require('../helpers/commServer/get');
// var commServerDelete = require('../helpers/commServer/delete');

// TODO create a service to be called by the comm server - Then route it from here

// router
//   .get('/:endPoint', commServerGet.getResource)
//   .post('/:endPoint', commServerPost.postResource)
//   .put('/:endPoint', commServerPut.putResource)
//   .post('/delete/:endPoint', commServerDelete.deleteResource)
//
// module.exports = router;
