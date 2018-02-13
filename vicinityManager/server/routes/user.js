var express = require('express');
var router = express.Router();
var putHelper = require('../controllers/user/put.js');
var getHelper = require('../controllers/user/get.js');
var deleteHelper = require('../controllers/user/delete.js');
var postHelper = require('../controllers/user/post.js');

router
  .get('/:id', getHelper.getOne)
  .get('/all/:id', getHelper.getAll)
  .post('/', postHelper.postOne)
  .put('/:id', putHelper.putOne)
  .put('/password/:id', putHelper.putPassword)
  .post('/delete/:id', deleteHelper.deleteUser);

module.exports = router;
