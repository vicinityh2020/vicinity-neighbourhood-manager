var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request');
require('request-debug')(request);


function getResource(req, res, next) {

  var endPoint = req.params.endPoint;
  var auth = req.headers.authorization;
  var format = 'application/json';

  var head = {
    'authorization' : auth,
    'Content-Type' : format,
    'Accept' : format
  };

request.get({
  headers: head,
  uri:     config.commServerUrl + '/' + endPoint + '/' + '593a44510a1bad02b11d5d12'
}, function(err, response, body) {
    logger.debug('REQUEST RESULTS:', err, body);
    res.json({'success':true,'message':body});
});

}

module.exports.getResource = getResource;
