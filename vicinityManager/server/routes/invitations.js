var express = require('express');
var router = express.Router();
var jwt = require("../middlewares/jwtauth");

var postHelper = require('../controllers/invitations/post.js');
var getHelper = require('../controllers/invitations/get.js');

router
  .post('/', jwt, postHelper.postOne)
  .get('/:id', getHelper.getOne);

module.exports = router;
