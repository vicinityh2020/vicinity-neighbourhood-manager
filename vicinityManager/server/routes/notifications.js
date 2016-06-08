var express = require('express');
var router = express.Router();

var notifications = require('./notifications/notifications.js');


router
  .get('/', notifications.getAll)
  .put('/:id/changeIsUnreadToFalse', notifications.changeIsUnreadToFalse)


module.exports = router;
