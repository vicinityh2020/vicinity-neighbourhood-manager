var updateDevicesServices = require('../services/updateDevices/facade.js');

module.exports.define = function(agenda) {
  agenda.define('update device', function(job){
    updateDevicesServices.performUpdate();
    //console.log("Job %s executed.", job.attrs.name);
  });
}

module.exports.every = function(agenda) {
  //agenda.every('10 seconds', 'update device');
  agenda.now('update device');
}
