var express = require('express');
var router = express.Router();

var regisController = require('../controllers/registrations/registrations.js');

router
  .post('/', regisController.requestRegistration)
  .get('/', regisController.getAll)
  .get('/:id', regisController.getOne)
  .put('/:id', regisController.createRegistration)
  // look for duplicates
  .post('/duplicatesUser', regisController.findDuplicatesUser)
  .post('/duplicatesCompany', regisController.findDuplicatesCompany)
  .post('/duplicatesRegMail', regisController.findDuplicatesRegMail);

module.exports = router;
