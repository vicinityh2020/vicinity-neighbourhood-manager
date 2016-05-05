var winston = require('winston');
var request = require('request');

winston.level = 'debug';

function getDevices(callback){
  winston.log('debug', 'exositeServices.getDevices start');
  var data = [{name: 'sdcdc'}, {name: 'adcscd'}];
  callback(data);
}

function addDevices(devices){
  winston.log('debug', 'exositeServices.addDevices start');
  for (i = 0; i < devices.length; i++){

    var options = { method: 'POST',
      url: 'https://portals.exosite.com/api/portals/v1/portals/2982322286/devices',
      headers:
       { 'postman-token': '6aea03c9-b3c8-f0fa-18e1-78fa5e443a80',
         'cache-control': 'no-cache',
         authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OkRyb3BkZWFkNTIx' },
      body: '{"type":"generic"}' };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      console.log(body);
    });

  }
}

function removeDevices(devices){
  winston.log('debug', 'exositeServices.removeDevices start');
}

module.exports.getDevices = getDevices;
module.exports.addDevices = addDevices;
module.exports.removeDevices = removeDevices;
