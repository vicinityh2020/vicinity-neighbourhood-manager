var winston = require('winston');
var ce = require('cloneextend');

winston.level = 'debug';


function getSharedDevices() {
  winston.log('debug', 'updateDevicesServices.getSharedDevices start');

}

function getOldDevices(cloudDevices, sharedDevices){
  winston.log('debug', 'updateDevicesServices.getOldDevices start');
  var oldDevices = ce.clone(cloudDevices);
  for (var i = oldDevices.length-1; i>=0; i --){
    var j = 0;
    while(j < sharedDevices.length && sharedDevices[j].name != oldDevices[i].info.description.name){
      j++;
    }

    if (j == sharedDevices.length){
      //Remove device which are shared;
      winston.log('debug', '%s should be removed', oldDevices[i].info.description.name);
    } else {
      winston.log('debug', '%s should not be removed', oldDevices[i].info.description.name);
      oldDevices.splice(i, 1);
    }
  }
  return oldDevices;
}

function getNewDevices(cloudDevices, sharedDevices){
  debugger;
  winston.log('debug', 'updateDevicesServices.getNewDevices start');
  var newDevices = ce.clone(sharedDevices);

  for (var i = newDevices.length-1; i>=0; i--){
    var j = 0;
    while(j < cloudDevices.length && cloudDevices[j].info.description.name != newDevices[i].name){
      j++;
    }

    if (j < cloudDevices.length){
      winston.log('debug', '%s should not be added', newDevices[i].name);
      newDevices.splice(i, 1);
    } else {
      winston.log('debug', '%s should be added', newDevices[i].name);
    }
  }
  return newDevices;
}

module.exports.sharedDevices = getSharedDevices;
module.exports.getNewDevices = getNewDevices;
module.exports.getOldDevices = getOldDevices;
