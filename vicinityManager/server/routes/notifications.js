var express = require('express');
var router = express.Router();

var notifications = require('./notifications/notifications.js');


router
  .get('/', notifications.getAll)
  .get('/registrations', notifications.getNotificationsOfRegistration)
  .get('/registrationsRead', notifications.getNotificationsOfRegistrationRead)
  .put('/:id/changeIsUnreadToFalse', notifications.changeIsUnreadToFalse)


module.exports = router;
