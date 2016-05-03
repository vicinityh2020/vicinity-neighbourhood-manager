var winston = require('winston');

winston.level = 'debug';

function getDevices(){
  winston.log('debug', 'exositeServices.getDevices start');
}

function addDevices(devices){
  winston.log('debug', 'exositeServices.addDevices start');
}

function removeDevices(devices){
  winston.log('debug', 'exositeServices.removeDevices start');
}

module.exports.getDevices = getDevices;
module.exports.addDevices = addDevices;
module.exports.removeDevices = removeDevices;
