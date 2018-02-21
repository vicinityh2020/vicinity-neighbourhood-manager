var express = require('express');
var router = express.Router();

var postHelper = require('../controllers/invitations/post.js');
var getHelper = require('../controllers/invitations/get.js');

router
  .post('/', postHelper.postOne)
  .get('/:id', getHelper.getOne);

module.exports = router;
