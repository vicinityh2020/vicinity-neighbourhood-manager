var express = require('express');
var router = express.Router();
var putHelper = require('../controllers/user/put.js');
var getHelper = require('../controllers/user/get.js');
var deleteHelper = require('../controllers/user/delete.js');

router
  .get('/:id', getHelper.getOne)
  .get('/all/:id', getHelper.getAll)
  .put('/:id', putHelper.putOne)
  .post('/delete/:id', deleteHelper.deleteUser);

module.exports = router;
