module.exports.getDevices = getDevices;
module.exports.addDevices = addDevices;
module.exports.removeDevices = removeDevices;
module.exports.writeData = writeData;
module.exports.readDataFromCommandedDevices = readDataFromCommandedDevices;


var winston = require('winston');
var request = require('request');
var async = require('async');
var ce = require('cloneextend');

var gatewayobjectOp = require('../../data/model').gatewayobject;

winston.level = 'debug';

function getDevices(callback){
  winston.log('debug', 'exositeServices.getDevices start');

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
    var gatewayObject = new gatewayobjectOp();

    gatewayObject.device_id = device._id;
    gatewayObject.info = ce.clone(device.info);
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
          winston.log('debug', JSON.stringify(body));
          createDataSources(gatewayObject, device, device_callback);
          gatewayObjects.push(gatewayObject);
      });
    });

  }, function(err){
    if (err) {
      winston.log('error', err.message);
    }
    callback();
  });
}

function removeDevices(devices, callback){
  winston.log('debug', 'exositeServices.removeDevices start');
  winston.log('debug', 'Number services being removed: ' + devices.length);

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
      winston.log('debug', body);

      gatewayobjectOp.remove({device_rid: device.rid}, function(err){
        if (err){
          winston.log('error', err.message);
        }
          device_callback();
      });
    });
  }, function(err){
    if (err) {
      winston.log('error', err.message);
    }
    winston.log('debug', 'All removed!');
    callback();
  });
}

function createDataSources(gatewayObject, device, device_callback){
  winston.log('debug', 'Start adding datasources');
  gatewayObject.type = device.type;
  if (!device.type){
    winston.log('info','Device type could not be recognized!');
    device_callback();
  } else
  {
    var datasources = [];
      if (device.type == "TINYM"){
        datasources = [
          {name: "co2", format: "float", unitOfMeasurement: "ppm"},
          {name: "temp", format: "float", unitOfMeasurement: "C"},
          {name: "light", format: "float", unitOfMeasurement: ""},
          {name: "moist", format: "float", unitOfMeasurement: ""},
          {name: "movement", format: "string", unitOfMeasurement: ""},
          {name: "noise", format: "float", unitOfMeasurement: ""}];
      } else if (device.type == "IS") {
        datasources = ce.clone(device.info.datasources);
        for (var i in datasources){
          winston.log("datasource.typeOf =  %s", datasources[i].typeOf);
          if (datasources[i].typeOf == "ON_OFF_Switch") {
            datasources[i].controllable = true;
          } else {
            datasources[i].controllable = false;
          }
        }
    } else if (device.type == "CERTH") {
        datasources = ce.clone(device.info.datasources);
    }
    async.forEachSeries(datasources, function(datasource, callback){
      winston.log('debug', 'Adding data source: ' + datasource.name);
      var options = { method: 'POST',
      url: 'https://portals.exosite.com/api/portals/v1/devices/' + gatewayObject.device_rid +'/data-sources',
      headers:
       { 'postman-token': 'fb754a74-fb06-950f-6b81-a070adb3c10d',
         'cache-control': 'no-cache',
         authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
         body: '{"info":{"description":{"format":"' + datasource.format + '","name":"' + datasource.name + '"}},"unit":"' + datasource.unitOfMeasurement + '"}' };

      winston.log('debug', JSON.stringify(options));
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        winston.log('debug', 'Adding data source done');
        var data = JSON.parse(body);
        winston.log('debug', 'datasource.name: ' + datasource.name);
        winston.log('debug', 'data.rid: ' + data.rid);
        gatewayObject.data_sources.push({
          name: datasource.name,
          rid: data.rid,
          controllable: datasource.controllable});

        callback();
      });
    }, function(err){
      if (err) {
        winston.log('error', err.message);
      }
      winston.log('debug', 'Adding all data sources done');
      device_callback();
    });
  }
}

function writeData(gatewayObjectsWithData, callback){
  winston.log('debug', 'Start: Writing data to Exosite portal');

  var datasources = [];
  for (var i in gatewayObjectsWithData){
    for (var j in gatewayObjectsWithData[i].data_sources){
      if (gatewayObjectsWithData[i].data_sources[j].rid != 'false'){
        winston.log('debug', 'i = %d j= %d', i,j);
        if (gatewayObjectsWithData[i].data_sources[j].data && gatewayObjectsWithData[i].data_sources[j].data.timestamp && gatewayObjectsWithData[i].data_sources[j].data.value){
          datasources.push({
            rid: gatewayObjectsWithData[i].data_sources[j].rid,
            data: '[[ ' + Math.floor(gatewayObjectsWithData[i].data_sources[j].data.timestamp / 1000) + ',"'  + gatewayObjectsWithData[i].data_sources[j].data.value + '"]]'
          });

        }
      }
    }
  }

  async.forEachSeries(datasources, function(datasource, datasource_callback){
    winston.log('debug', 'Start: writing data in Exosite for datasource: ' + datasource.rid);

    var options = { method: 'POST',
      url: 'https://portals.exosite.com/api/portals/v1/data-sources/' + datasource.rid + '/data',
      headers:
       { 'postman-token': '8b688437-fffc-0aa7-842f-a920901d08fd',
         'cache-control': 'no-cache',
         authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
      body: datasource.data };


    winston.log('debug','Writing data %s in datasource %s.', datasource.data, datasource.rid);
    winston.log('debug',JSON.stringify(options));
    request(options, function (error, response, body) {
      winston.log('debug', 'Response status: %s, body: %s',response.statusCode, body);
      winston.log('debug', 'End: writing data in Exosite for datasource: ' + datasource.rid);
      datasource_callback();
    });

  }, function(err){
    if (err) {
      winston.log('error', err.message);
    }
    winston.log('debug', 'End: Writing data to Exosite portal');
    callback();
  });
}


function readDataFromCommandedDevices(cloudDevices, callback) {
   winston.log('debug', 'Start: reading data from %d commanded devices', cloudDevices.length);

   var dataSources = [];

   for (var i in cloudDevices){
     dataSources = dataSources.concat(cloudDevices[i].data_sources.toObject());
   }

   async.forEachSeries(dataSources, function(dataSource, device_callback){
      winston.log('debug', 'dataSource %s', dataSource.rid);
      var options = { method: 'GET',
        url: 'https://portals.exosite.com/api/portals/v1/data-sources/' + dataSource.rid + '/data',
        headers:
         { 'postman-token': 'fb44a86e-b864-c14e-963e-b7d2919164e0',
           'cache-control': 'no-cache',
           authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' }};

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        winston.log('debug',body);
        var data = body.replace('[[','').replace(']]','').replace('"','').replace('"','').split(',');
        for (var i in cloudDevices){
          for (var j in cloudDevices[i].data_sources){
              if (dataSource.rid == cloudDevices[i].data_sources[j].rid){

                cloudDevices[i].data_sources[j].value = data[1];
                cloudDevices[i].data_sources[j].timestamp = data[0];
              }
          }
        }
        device_callback();
      });

   },
    function(err){
      winston.log('debug', 'End: reading data from commanded devices');
      callback(null, cloudDevices);
    });
}
