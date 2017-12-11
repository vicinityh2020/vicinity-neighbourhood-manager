
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
    uri: config.semanticRepoUrl + "sparql/",
    body: payload
    // simple: true
  });

}

/*
Semantic Repository static call
When invoked retrieves all available subclasses or types of a given class in the VicinitySchema
The headers are preconfigured
WITHOUT INFERENCES!!!!! -- Only child
*/
function getSubclass(thing){
  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  query = {"query" : "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>  PREFIX core:<http://iot.linkeddata.es/def/core#> PREFIX : <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#> select distinct * WHERE{ { select ?s WHERE{ Graph <http://vicinity.eu/schema> {  ?s a " + thing + " . }}} UNION {select ?s WHERE  { Graph  <http://vicinity.eu/schema> {  ?s rdfs:subClassOf " + thing + " . }}}}" };

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql/",
    body: payload
    // simple: true
  });
}

/*
Semantic Repository static call
When invoked retrieves all available subclasses or types of a given class in the VicinitySchema
The headers are preconfigured
WITH INFERENCES!!!!! -- Childs and all grandchilds
*/
function getAllSubclass(thing){
  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  query = {"query" : "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>  PREFIX core:<http://iot.linkeddata.es/def/core#> PREFIX : <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#> select distinct * WHERE{ { select ?s WHERE{ ?s a " + thing + " . }} UNION {select ?s WHERE {  ?s rdfs:subClassOf " + thing + " . }}}" };

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql/",
    body: payload
    // simple: true
  });
}

/*
Semantic Repository static call
When invoked retrieves all available graphs containing the selected class
The headers are preconfigured
If getGraph true --> Retrieves the context instead of the subject, necessary for properties
*/
function getGraphOids(thing, predicate, getGraph){
  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  if(getGraph === true){
    query = {"query": "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>  PREFIX core: <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#>  PREFIX : <http://iot.linkeddata.es/def/core#> select distinct ?s WHERE { GRAPH ?s { ?sub " + predicate + " " + thing + " . } }" };
  } else {
    query = {"query": "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>  PREFIX core: <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#>  PREFIX : <http://iot.linkeddata.es/def/core#> select distinct ?s WHERE { ?s " + predicate + " " + thing + " . }" };
  }

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql/",
    body: payload
    // simple: true
  });
}

/*
Semantic Repository static call
When invoked retrieves all available types of devices or services
The headers are preconfigured
*/
function registerItem(td){

  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  payload = JSON.stringify(td);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "register/",
    body: payload
    // simple: true
  });

}

/*
Semantic Repository static call
When invoked removes one item - oid passed as parameter
The headers are preconfigured
*/
function removeItem(oid){

  var head = {
    // 'authorization' : config.commServerToken,
    'Content-Type' : 'application/json',
    'Accept' : 'application/json',
    'simple': false
  };

  return request({
    method : "DELETE",
    headers: head,
    uri: config.semanticRepoUrl + "remove/" + oid
    // simple: true
  });

}

// Export functions
module.exports.callSemanticRepo = callSemanticRepo;
module.exports.getTypes = getTypes;
module.exports.registerItem = registerItem;
module.exports.removeItem = removeItem;
module.exports.getSubclass = getSubclass;
module.exports.getAllSubclass = getAllSubclass;
module.exports.getGraphOids = getGraphOids;
