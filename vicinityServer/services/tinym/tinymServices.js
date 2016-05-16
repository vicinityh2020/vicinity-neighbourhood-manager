module.exports.getData = getData;

var winston = require('winston');
winston.level = 'debug';


function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Retrieving data from tinym IoT infrastructure');

  

  winston.log('debug', 'End: Retrieving data from tinym IoT infrastructure');
  callback();
}
