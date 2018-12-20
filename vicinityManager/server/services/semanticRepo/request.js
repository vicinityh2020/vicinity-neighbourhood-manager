
// Global Objects

var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request-promise');
var head = {
  // 'authorization' : config.commServerToken,
  'Content-Type' : 'application/json; charset=utf-8',
  'Accept' : 'application/json',
  'simple': false
};

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
  if(process.env.env === 'test') return Promise.resolve(true);
  payload = JSON.stringify(data);
  var options = {};
  options.method = myMethod;
  options.headers = head;
  options.uri = config.semanticRepoUrl + endPoint;
  options.body = payload;
  if(config.semanticrepoTimeoutMs && Number(config.semanticrepoTimeoutMs) !== 0) options.timeout = config.semanticrepoTimeoutMs;
  return request(options);
}

/*
Semantic Repository static call
When invoked retrieves all available types of devices or services
The headers are preconfigured
*/
function getTypes(){
  var options = {};
  options.method = "GET";
  options.headers = head;
  options.uri = config.semanticRepoUrl + "annotations";
  if(config.semanticrepoTimeoutMs && Number(config.semanticrepoTimeoutMs) !== 0) options.timeout = config.semanticrepoTimeoutMs;
  return request(options);
}

/*
Semantic Repository static call
When invoked retrieves all available subclasses or types of a given class in the VicinitySchema
The headers are preconfigured
WITHOUT INFERENCES!!!!! -- Only child
*/
function getSubclass(thing){

  query = {"query" : "PREFIX adapters: <http://iot.linkeddata.es/def/adapters#> PREFIX systems: <http://www.w3.org/ns/ssn/systems/> PREFIX sosa: <http://www.w3.org/ns/sosa/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://www.w3.org/ns/ssn/>  PREFIX core:<http://iot.linkeddata.es/def/core#> PREFIX : <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#> select distinct * WHERE{ { select ?s WHERE{ Graph <http://vicinity.eu/schema> {  ?s a " + thing + " . }}} UNION {select ?s WHERE  { Graph  <http://vicinity.eu/schema> {  ?s rdfs:subClassOf " + thing + " . }}}}" };

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql",
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
  query = {"query" : "PREFIX adapters: <http://iot.linkeddata.es/def/adapters#> PREFIX systems: <http://www.w3.org/ns/ssn/systems/> PREFIX sosa: <http://www.w3.org/ns/sosa/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://www.w3.org/ns/ssn/>  PREFIX core:<http://iot.linkeddata.es/def/core#> PREFIX : <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#> select distinct * WHERE{ { select ?s WHERE{ ?s a " + thing + " . }} UNION {select ?s WHERE {  ?s rdfs:subClassOf " + thing + " . }}}" };

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql",
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

  if(getGraph === true){
    query = {"query": "PREFIX adapters: <http://iot.linkeddata.es/def/adapters#> PREFIX systems: <http://www.w3.org/ns/ssn/systems/> PREFIX sosa: <http://www.w3.org/ns/sosa/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://www.w3.org/ns/ssn/>  PREFIX core: <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#>  PREFIX : <http://iot.linkeddata.es/def/core#> select distinct ?s WHERE { GRAPH ?s { ?sub " + predicate + " " + thing + " . } }" };
  } else {
    query = {"query": "PREFIX adapters: <http://iot.linkeddata.es/def/adapters#> PREFIX systems: <http://www.w3.org/ns/ssn/systems/> PREFIX sosa: <http://www.w3.org/ns/sosa/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  PREFIX ssn: <http://www.w3.org/ns/ssn/>  PREFIX core: <http://iot.linkeddata.es/def/core#> PREFIX wot: <http://iot.linkeddata.es/def/wot#>  PREFIX : <http://iot.linkeddata.es/def/core#> select distinct ?s WHERE { ?s " + predicate + " " + thing + " . }" };
  }

  payload = JSON.stringify(query);

  return request({
    method : "POST",
    headers: head,
    uri: config.semanticRepoUrl + "sparql",
    body: payload
    // simple: true
  });
}

// Export functions
module.exports.callSemanticRepo = callSemanticRepo;
module.exports.getTypes = getTypes;
module.exports.getSubclass = getSubclass;
module.exports.getAllSubclass = getAllSubclass;
module.exports.getGraphOids = getGraphOids;
