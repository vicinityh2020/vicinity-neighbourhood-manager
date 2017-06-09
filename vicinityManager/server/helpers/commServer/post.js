var config = require('../../configuration/configuration');
var logger = require('../../middlewares/logger');
var request = require('request');
require('request-debug')(request);


function postResource(req, res, next) {

  var endPoint = req.params.endPoint;
  var auth = req.headers.authorization;
  var format = 'application/json';

  if(req.body.route){
    var endPoint = req.params.endPoint + '/' + req.body.route;
  }

  var head = {
    'authorization' : auth,
    'Content-Type' : format,
    'Accept' : format
  };

  payload = JSON.stringify(req.body);

  request.post({
    headers: head,
    uri: config.commServerUrl + '/' + endPoint,
    body: payload
  }, function(err, response, body) {
      logger.debug('REQUEST RESULTS:', err, response.statusCode, body);
      res.json({'success':true,'message':body});
  });

}

function registerCompany(data, authorization){
  var endPoint = 'groups';
  var auth = authorization;
  var format = 'application/json';

  var head = {
    'authorization' : auth,
    'Content-Type' : format,
    'Accept' : format
  };

  payload = JSON.stringify({
    name: data._id,
    description: data.organisation
  });

  request.post({
    headers: head,
    uri: config.commServerUrl + '/' + endPoint,
    body: payload
  }, function(err, response, body) {
      logger.debug('REQUEST RESULTS:', err, response.statusCode, body);
      //res.json({'success':true,'message':body});
  });
}

module.exports.registerCompany = registerCompany;
module.exports.postResource = postResource;
