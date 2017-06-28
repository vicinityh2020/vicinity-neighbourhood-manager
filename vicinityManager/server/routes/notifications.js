var express = require('express');
var router = express.Router();

var notifications = require('./notifications/notifications.js');


router
  .get('/', notifications.getAll)
  .get('/registrations', notifications.getNotificationsOfRegistration)
  .get('/registrationsRead', notifications.getNotificationsOfRegistrationRead)
  .get('/:id/allNotifications', notifications.getAllUserNotifications)
  .get('/allRegistrations', notifications.getAllRegistrations)
  .put('/:id/changeIsUnreadToFalse', notifications.changeIsUnreadToFalse)
  .put('/:id/:status/changeStatusToResponded', notifications.changeStatusToResponded2)
  .put('/:id/updateNotificationOfRegistration', notifications.updateNotificationOfRegistration);

module.exports = router;
