var updateDevicesServices = require('../services/updateDevices/facade.js');
var winston = require('winston');

module.exports.define = function(agenda) {
  agenda.define('update device', function(job){
      winston.log('debug', 'Job %s executed.', job.attrs.name);
      updateDevicesServices.performUpdate();
  });
}

module.exports.every = function(agenda) {
  //agenda.every('10 seconds', 'update device');
  //agenda.now('update device');
  agenda.every('20 seconds', 'update device');
}
