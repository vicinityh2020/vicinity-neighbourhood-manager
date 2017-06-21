var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request-promise');

function callCommServer(data, endPoint, myMethod, authorization){

  var auth = authorization;
  var format = 'application/json';
  var head = {
    'authorization' : auth,
    'Content-Type' : format,
    'Accept' : format
  };

  payload = JSON.stringify(data);

  return request({
    method : myMethod,
    headers: head,
    uri: config.commServerUrl + '/' + endPoint,
    body: payload,
    // simple: true
  }
    , function(err, response, body) {
        logger.debug('REQUEST RESULTS:', err, response.statusCode, body);
    }
  );

}

module.exports.callCommServer = callCommServer;
