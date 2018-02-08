var express = require('express');
var router = express.Router();
var putHelper = require('./user/put.js');
var getHelper = require('./user/get.js');
var deleteHelper = require('./user/delete.js');
var postHelper = require('./user/post.js');

router
  .get('/:id', getHelper.getOne)
  .get('/all/:id', getHelper.getAll)
  .post('/', postHelper.postOne)
  .put('/:id', putHelper.putOne)
  .put('/password/:id', putHelper.putPassword)
  .post('/delete/:id', deleteHelper.deleteUser);

module.exports = router;
