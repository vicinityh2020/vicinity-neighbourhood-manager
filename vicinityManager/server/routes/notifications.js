var express = require('express');
var router = express.Router();

var notifications = require('../controllers/notifications/notifications.js');

router
  .get('/', notifications.getNotifications)
  .get('/refresh', notifications.refreshNotifications)
  .put('/:id/changeIsUnreadToFalse', notifications.changeIsUnreadToFalse)
  .put('/:id/changeStatusToResponded', notifications.changeToResponded);

module.exports = router;
