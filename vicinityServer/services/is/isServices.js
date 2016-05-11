module.exports.getData = getData;

var winston = require('winston');

winston.level = 'debug';


function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Reading data from Tinym infrastructure');
  winston.log('debug', 'End: Reading data from Tinym infrastructure');
  callback();
}
