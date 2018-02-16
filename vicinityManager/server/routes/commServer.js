var express = require('express');
var router = express.Router();

var controllers = require('../controllers/commServer/commServer');

// Endpoints accessible from the gateway

router
// items
.post('/items/register', controllers.registration)
.post('/items/searchItems', controllers.searchItems)
.post('/items/remove', controllers.deleteItems)
.post('/items/enable', controllers.enableItems)
.post('/items/disable', controllers.disableItems)
.put('/items/update', controllers.updateItems)
// agent
.get('/agent/:adid/items', controllers.getAgentItems) // change to post if depends on update or use query
.delete('/agent/:adid', controllers.deleteAgent);

module.exports = router;
