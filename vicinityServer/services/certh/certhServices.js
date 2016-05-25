module.exports.getData = getData;
module.exports.writeCommand = writeCommand;


var winston = require('winston');
var async = require('async');
var request = require("request");
var parseString = require('xml2js').parseString;


winston.level = 'debug';

function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Reading data from CERTH infrastructure');
  winston.log('debug', 'GatewayObjects being processed: ' + gatewayObjects.length);
  async.forEachSeries(gatewayObjects, function(gatewayObject, device_callback){

    if (gatewayObject.type == "CERTH") {
      winston.log('debug','Processing device: ' + gatewayObject.device_id.toString());

      var options = { method: 'GET',
        url: 'http://160.40.51.136/StorageManager/REST/iotentities/' + gatewayObject.info.id_value,
        headers:
         { 'postman-token': '5ae48d4e-2485-3606-e4a0-0b9ce3ee0775',
           'cache-control': 'no-cache' } };

      request(options, function (error, response, body) {
        if (error) {
          winston.log('error', error.message);
          device_callback();
        } else {
          winston.log('debug', body);

          parseString(body, function(err, data){
            winston.log('debug', data);
            for (var i in data.IoTEntity.IoTProperty){
              for (var j in gatewayObject.data_sources){
                if (data.IoTEntity.IoTProperty[i].Name[0] === gatewayObject.data_sources[j].name){
                  winston.log('debug','Processing data source: ' + data.IoTEntity.IoTProperty[i].Name[0]);
                  gatewayObject.data_sources[j].data =
                    { timestamp : Date.parse(data.IoTEntity.IoTProperty[i].IoTStateObservation[0].ResultTime[0]),
                      value: data.IoTEntity.IoTProperty[i].IoTStateObservation[0].Value[0]};
                  winston.log('debug','Timestamp: %s Value: %s',
                    gatewayObject.data_sources[j].data.timestamp,
                    gatewayObject.data_sources[j].data.value);
                }
              }
            }
            device_callback();
          });
        }

      });
    } else {
      device_callback();
    }
  }, function(err){
    if (err){
      winston.log('error', err.message);
    }
    callback();
  });

  winston.log('debug', 'End: Reading data from CERTH infrastructure');
}

function writeCommand(device){
  winston.log('debug', 'Start: Write command in device' + device.info.id_value);
  winston.log('debug', 'End: Write command in device');
}
