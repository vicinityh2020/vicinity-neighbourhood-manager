
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
    'Content-Type' : 'application/json; charset=utf-8',
    'Accept' : 'application/json',
    'simple': false
  };

  payload = JSON.stringify(data);

  var options = {};
  options.method = myMethod;
  options.headers = head;
  options.uri = config.commServerUrl + '/' + endPoint;
  if(myMethod !== 'GET'){ options.body = payload; }

  return request(options);
  // return request(options, function(err, response, body) {
      // try{
      //   logger.debug('REQUEST RESULTS:', err, response.statusCode, body);
      // } catch(error){
      //   logger.error(error.stack);
      // }
  //   }
  // );

}

module.exports.callCommServer = callCommServer;
