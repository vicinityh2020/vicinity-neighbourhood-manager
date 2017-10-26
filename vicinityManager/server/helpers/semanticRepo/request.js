
// Global Objects

var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request-promise');

// Functions

/*
Semantic Repository request service
When invoked requires 3 obligatory parameters:
data - Object - Contains payload and may be an empty object  if not required {}
endpoint - String - Endpoint where the request must be addressed
myMethod - String - POST, GET, PUT, DELETE
The headers are preconfigured
*/
function callSemanticRepo(data, endPoint, myMethod){

  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  payload = JSON.stringify(data);

  return request({
    method : myMethod,
    headers: head,
    uri: config.semanticRepoUrl,
    body: payload
    // simple: true
  });
}

/*
Semantic Repository static call
When invoked retrieves all available types of devices or services
The headers are preconfigured
*/
function getTypes(typeOfItem){

  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  query = {"query": "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX core: <http://iot.linkeddata.es/def/core#>PREFIX wot: <http://iot.linkeddata.es/def/wot#>SELECT distinct * WHERE {?s rdfs:subClassOf core:" + typeOfItem + "} LIMIT 100" };
  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl,
    body: payload
    // simple: true
  });

}

// Export functions
module.exports.callSemanticRepo = callSemanticRepo;
module.exports.getTypes = getTypes;
