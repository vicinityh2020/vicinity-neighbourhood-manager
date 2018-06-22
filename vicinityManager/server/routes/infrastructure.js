var express = require('express');
var router = express.Router();

var controllers = require('../controllers/infrastructure/infrastructure');

// Endpoints accessible from the gateway

router
// items
.get('/gateways', controllers.getAvailableGateways)
.get('/users', controllers.getAvailableUsers)
.put('/moveItem', controllers.moveItem)
.put('/moveContract', controllers.moveContract)
.put('/changeGateway', controllers.changeGateway)
.post('/sendNotification', controllers.sendNotification);

module.exports = router;
