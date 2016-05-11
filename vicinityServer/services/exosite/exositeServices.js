var winston = require('winston');
var request = require('request');
var async = require('async');
var mongoose = require('mongoose');

var gatewayobjectOp = require('../../data/model').gatewayobject;

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

function addDevices(devices, gatewayObjects, callback){
  winston.log('debug', 'exositeServices.addDevices start');
  async.forEachSeries(devices, function(device, device_callback){

    winston.log('debug', 'Adding device into exosite: ' + device.name);
    gatewayObject = new gatewayobjectOp();

    gatewayObject.device_id = device._id;
    var options = { method: 'POST',
      url: 'https://portals.exosite.com/api/portals/v1/portals/2982322286/devices',
      headers:
       { 'postman-token': '6aea03c9-b3c8-f0fa-18e1-78fa5e443a80',
         'cache-control': 'no-cache',
         authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
      body: '{"type":"generic"}' };

    request(options, function (error, response, body) {
      var data = JSON.parse(body);

      winston.log('debug', 'Device has rid: ' + data.rid);

      gatewayObject.device_rid = data.rid;
      var options = { method: 'PUT',
        url: 'https://portals.exosite.com/api/portals/v1/devices/' + data.rid,
        headers:
         { 'postman-token': '6aea03c9-b3c8-f0fa-18e1-78fa5e443a80',
           'cache-control': 'no-cache',
           authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
        body: '{"info": {"description": {"name": "' + device.name + '"}}}' };

      request(options, function(error, response, body) {
          winston.log('debug', 'Adding data sources to device.');
          createDataSources(gatewayObject, device, device_callback);
          gatewayObjects.push(gatewayObject);
      });
    });

  }, function(err){
    callback();
  });
}

function removeDevices(devices, callback){
  winston.log('debug', 'exositeServices.removeDevices start');
  winston.log('debug', 'Number services being removed: ' + devices.length);

  //XXX: Remove device gateway object

  async.forEachSeries(devices, function(device, device_callback){
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

      gatewayobjectOp.remove({device_rid: device.rid}, function(err){
          device_callback();
      });
    });
  }, function(err){
    winston.log('debug', 'All removed!');
    callback();
  });
}

function createDataSources(gatewayObject, device, device_callback){
  winston.log('debug', 'Start adding datasources');
  if (device.type == "TINYM"){
      datasources = [
        {name: "co2", format: "float", unit: "ppm"},
        {name: "temp", format: "float", unit: "C"},
        {name: "light", format: "float", unit: ""},
        {name: "moist", format: "float", unit: ""},
        {name: "movement", format: "boolean", unit: ""},
        {name: "noise", format: "float", unit: ""}];

      async.forEachSeries(datasources, function(datasource, callback){
        winston.log('debug', 'Adding data source: ' + datasource.name);
        var options = { method: 'POST',
        url: 'https://portals.exosite.com/api/portals/v1/devices/' + gatewayObject.device_rid +'/data-sources',
        headers:
         { 'postman-token': 'fb754a74-fb06-950f-6b81-a070adb3c10d',
           'cache-control': 'no-cache',
           authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
           body: '{"info":{"description":{"format":"' + datasource.format + '","name":"' + datasource.name + '"}},"unit":"' + datasource.unit + '"}' };

        winston.log('debug', JSON.stringify(options));
        request(options, function (error, response, body) {
          if (error) throw new Error(error);
          winston.log('debug', 'Adding data source done');
          data = JSON.parse(body);
          winston.log('debug', 'datasource.name: ' + datasource.name);
          winston.log('debug', 'data.rid: ' + data.rid);
          gatewayObject.data_sources.push({name: datasource.name, rid: data.rid});
          callback();
        });
      }, function(err){
        winston.log('debug', 'Adding all data sources done');
        device_callback();
      });

  } else if (device.type = "IS") {
    datasources = [
      {name: "energy", format: "float", unit: "ppm"},
      {name: "switch", format: "boolean", unit: "-"}];
  }
}



function createGatewayObject(){

}

module.exports.getDevices = getDevices;
module.exports.addDevices = addDevices;
module.exports.removeDevices = removeDevices;
