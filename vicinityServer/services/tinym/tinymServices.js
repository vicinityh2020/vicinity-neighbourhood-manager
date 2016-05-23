module.exports.getData = getData;

var winston = require('winston');
var async = require('async');
var request = require("request");

winston.level = 'debug';


function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Retrieving data from tinym IoT infrastructure');



  async.waterfall([
      function(device_callback){
          winston.debug('debug', 'Getting list of messages');
          var tinymMessages = [];

          var options = { method: 'GET',
            url: 'https://http.cloud-ng.tiny-mesh.com/v2/messages/T',
            qs: { 'date.to': 'NOW', 'date.from': 'NOW//-1MINUTE' },
            headers:
             { 'postman-token': 'b8716352-4bfa-1cbf-a8f9-b8e685505b3e',
               'cache-control': 'no-cache',
               authorization: 'Basic dmlrdG9yLm9yYXZlY0BiYXZlbmlyLmV1OlNhbHR5Q3JlYW1QdWZmc30=' } };

          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            var data = JSON.parse(body);
            winston.log('debug', 'TINYM messages has been received: ' + data.result.length);
            tinymMessages = data.result;
            return device_callback(null, tinymMessages);
            });
      },
      function(tinymMessages, device_callback){
          var filteredTinymMessages =  [];
          if (tinymMessages.length > 0){
            for (i in gatewayObjects){
              var j = 0;
              winston.log('debug', "Message %d: %s", j, JSON.stringify(tinymMessages[j]));
              while(j < tinymMessages.length && tinymMessages[j]["proto/tm"].uid != gatewayObjects[i].info.id_value){
                  j++;
                  winston.log('debug', "Message %d: %s", j, JSON.stringify(tinymMessages[j]));
              }
              if (j < tinymMessages.length && tinymMessages[j]["proto/tm"].uid == gatewayObjects[i].info.id_value){
                  winston.log('debug', 'Message found for device: ' + gatewayObjects[i].info.id_value);
                  filteredTinymMessages.push(tinymMessages[j]);
              }
            }
          }


          filteredTinymMessages.sort(messageSorterDesc);

          for (i in filteredTinymMessages){
            winston.log('debug', 'Times: %s',filteredTinymMessages[i].datetime);
          }

          return device_callback(null, filteredTinymMessages);
      },
      function(filteredTinymMessages, device_callback){

          for (var i in filteredTinymMessages){
              for (var j in gatewayObjects){
                winston.log('debug', 'i = %s, j = %s', i, j);
                if (filteredTinymMessages[i]["proto/tm"].uid == gatewayObjects[j].info.id_value){
                  winston.log('debug', 'Extracting data from message %s to device %s',
                    filteredTinymMessages[i].key,
                    gatewayObjects[j].device_rid
                  );
                  extractDataFromMessage(filteredTinymMessages[i], gatewayObjects[j]);
                }
              }
          }
          device_callback(null, 'done');
      }
    ],
    function (err, result) {
        winston.log('debug', 'Start: Data from TINYM devices has been read');
        callback();
    }
  )
}

function extractDataFromMessage(message, gatewayObject){
  for(i in gatewayObject.data_sources){
    if (gatewayObject.data_sources[i].name == 'co2'){
      extractCO2(message, gatewayObject.data_sources[i]);
    } else if (gatewayObject.data_sources[i].name == 'light'){
      extractLight(message, gatewayObject.data_sources[i]);
    } else if (gatewayObject.data_sources[i].name == 'moist'){
      extractMoist(message, gatewayObject.data_sources[i]);
    } else if (gatewayObject.data_sources[i].name == 'noise'){
      extractNoise(message, gatewayObject.data_sources[i]);
    } else if (gatewayObject.data_sources[i].name == 'temp'){
      extractTemp(message, gatewayObject.data_sources[i]);
    }
  }
}

function extractCO2(message, datasource){
  winston.log('debug', 'Extracting CO2');
  datasource.data = {timestamp: Date.parse(message.datetime), value: message["proto/tm"].data};
  winston.log('debug', 'Extracted timestamp: %s data: %s', datasource.data.timestamp, datasource.data.value);
}

function extractLight(message, datasource){
  winston.log('debug', 'Extracting light');
  datasource.data = {timestamp: Date.parse(message.datetime), value: Math.pow(10, message["proto/tm"].aio0 * 0.0015658) * 100};
  winston.log('debug', 'Extracted timestamp: %s data: %s', datasource.data.timestamp, datasource.data.value);
}

function extractMoist(message, datasource){
  winston.log('debug', 'Extracting moist');
  datasource.data = {timestamp: Date.parse(message.datetime), value: (((message["proto/tm"].locator >> 16) / 16382 ) * 100) * 100};
  winston.log('debug', 'Extracted timestamp: %s data: %s', datasource.data.timestamp, datasource.data.value);
}

function extractNoise(message, datasource){
  winston.log('debug', 'Extracting noise');
  datasource.data = {timestamp: Date.parse(message.datetime), value: (90 - (30 * (message["proto/tm"].aio1 / 2048))) * 100};
  winston.log('debug', 'Extracted timestamp: %s data: %s', datasource.data.timestamp, datasource.data.value);
}

function extractTemp(message, datasource){
  winston.log('debug', 'Extracting temperature');
  datasource.data = {timestamp: Date.parse(message.datetime), value: (((((message["proto/tm"].locator && 65535) / 4 ) / 16382) * 165) - 40 ) * 100};
  winston.log('debug', 'Extracted timestamp: %s data: %s', datasource.data.timestamp, datasource.data.value);
}


function messageSorterDesc(a, b){
  if (a.datetime < b.datetime) {
    return 1;
  } else if (a.datetime > b.datetime) {
    return -1;
  } else {
    return 0;
  }
}
