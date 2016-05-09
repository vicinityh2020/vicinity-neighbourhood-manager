var winston = require('winston');
var request = require('request');
var async = require('async');

winston.level = 'debug';

function getDevices(callback){
  winston.log('debug', 'exositeServices.getDevices start');
  var data = [{name: 'sdcdc'}, {name: 'adcscd'}];

  var options = { method: 'GET',
    url: 'https://portals.exosite.com/api/portals/v1/portals/2982322286/devices',
    headers:
     { 'postman-token': 'f3f78cbe-b0c2-2614-0539-def89fffb6e9',
       'cache-control': 'no-cache',
       authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
    body: '{"type":"generic"}' };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var data = JSON.parse(body);
    callback(data);
  });
}

function addDevices(devices){
  winston.log('debug', 'exositeServices.addDevices start');

  async.forEachSeries(devices, function(device, callback){

    var options = { method: 'POST',
      url: 'https://portals.exosite.com/api/portals/v1/portals/2982322286/devices',
      headers:
       { 'postman-token': '6aea03c9-b3c8-f0fa-18e1-78fa5e443a80',
         'cache-control': 'no-cache',
         authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
      body: '{"type":"generic"}' };

    request(options, function (error, response, body) {
      var data = JSON.parse(body);
      winston.log('debug', 'device added with rid: ' + data.rid);

      var options = { method: 'PUT',
        url: 'https://portals.exosite.com/api/portals/v1/devices/' + data.rid,
        headers:
         { 'postman-token': '6aea03c9-b3c8-f0fa-18e1-78fa5e443a80',
           'cache-control': 'no-cache',
           authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
        body: '{"info": {"description": {"name": "' + device.name + '"}}}' };

      request(options, function(error, response, body) {
          winston.log('debug', 'device added and renamed');
          callback();
      });
    });

  });
}

function removeDevices(devices,callback){
  winston.log('debug', 'exositeServices.removeDevices start');
  winston.log('debug', 'Number services being removed: ' + devices.length);

  async.forEachSeries(devices, function(device, callback){
    var options = { method: 'DELETE',
    url: 'https://portals.exosite.com/api/portals/v1/devices/' + device.rid,
    headers:
     { 'postman-token': '58ccf684-1d25-e7b8-e914-de579381e499',
       'cache-control': 'no-cache',
       authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
    body: '{"type":"generic"}' };

    winston.log('debug', 'request: ' + options);

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      winston.log('debug', 'status code: ' + response.statusCode);
      callback();
    });
  }, function(err){
    winston.log('debug', 'All removed!');
    callback();
  })
  for (var i = 0; i < devices.lenghth; i++) {

  }

}

module.exports.getDevices = getDevices;
module.exports.addDevices = addDevices;
module.exports.removeDevices = removeDevices;
