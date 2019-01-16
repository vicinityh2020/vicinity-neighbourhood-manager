var express = require('express');
var router = express.Router();

var notifications = require('../controllers/notifications/notifications.js');

router
  .get('/', notifications.getNotifications)
  .get('/refresh', notifications.refreshNotifications);

module.exports = router;
