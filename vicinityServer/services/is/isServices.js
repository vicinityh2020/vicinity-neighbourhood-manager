module.exports.getData = getData;

var winston = require('winston');

winston.level = 'debug';


function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Reading data from IS infrastructure');
  winston.log('debug', 'End: Reading data from IS infrastructure');
  callback();
}
