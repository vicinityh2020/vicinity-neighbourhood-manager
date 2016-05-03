var winston = require('winston');

winston.level = 'debug';


function getSharedDevices() {
  winston.log('debug', 'updateDevicesServices.getSharedDevices start');
}

function getOldDevices(cloudDevices, sharedDevices){
  winston.log('debug', 'updateDevicesServices.getOldDevices start');
}

function getNewDevices(cloudDevicesm, sharedDevices){
  winston.log('debug', 'updateDevicesServices.getNewDevices start');
}

module.exports.sharedDevices = getSharedDevices;
module.exports.getNewDevices = getNewDevices;
module.exports.getOldDevices = getOldDevices;
