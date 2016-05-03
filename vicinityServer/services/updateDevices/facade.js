var vicinityManagerServices = require('./vicinityManagerServices.js');
var exositeServices = require('./exositeServices.js');
var updateDevicesServices = require('./updateDevicesServices.js');
var winston = require('winston');
winston.level = 'debug';

function updateListOfDevicesInCloud() {
  winston.log('debug', 'Update list of devices in cloud started');
  //TODO: Get list of shared devices in VICINITY;
  var sharedDevices = vicinityManagerServices.getSharedDevices();

  //TODO: Get list of shared devices in ExoSite;
  var cloudDevices = exositeServices.getDevices();

  //TODO: Create list of shared devices which needs to be removed from ExoSite;
  var oldDevices = updateDevicesServices.getOldDevices(cloudDevices, sharedDevices);

  //TODO: Create list of shared deveice which needs to be added to ExoSite;
  var newDevices = updateDevicesServices.getNewDevices(cloudDevices, sharedDevices);

  //TODO: Add shared devices to ExoSite;
  exositeServices.addDevices(newDevices);

  //TODO: Remove shared devices from ExoSite;
  exositeServices.removeDevices(oldDevices);
}

module.exports.performUpdate = updateListOfDevicesInCloud;
