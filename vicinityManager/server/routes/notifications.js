var express = require('express');
var router = express.Router();

var notifications = require('../controllers/notifications/notifications.js');

router
  .get('/:id/userNotifications', notifications.getNotificationsOfUser)
  .get('/registrations', notifications.getNotificationsOfRegistration)
  .get('/:id/allUserNotifications', notifications.getAllUserNotifications)
  .get('/allRegistrations', notifications.getAllRegistrations)
  .put('/:id/changeIsUnreadToFalse', notifications.changeIsUnreadToFalse)
  .put('/:id/changeStatusToResponded', notifications.changeToResponded);

module.exports = router;
