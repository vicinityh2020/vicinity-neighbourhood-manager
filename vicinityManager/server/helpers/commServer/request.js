
// Global Objects

var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request-promise');

// Functions

/*
Communication Server request service
When invoked requires 3 obligatory parameters:
data - Object - Contains payload and may be an empty object  if not required {}
endpoint - String - Endpoint where the request must be addressed
myMethod - String - POST, GET, PUT, DELETE
The headers are preconfigured and the token is stored under /configuration
*/
function callCommServer(data, endPoint, myMethod){

  var head = {
    'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json'
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
