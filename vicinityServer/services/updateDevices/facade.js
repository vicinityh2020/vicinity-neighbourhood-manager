var vicinityManagerServices = require('../vicinityManager/vicinityManagerServices.js');
var exositeServices = require('../exosite/exositeServices.js');
var updateDevicesServices = require('./updateDevicesServices.js');
var winston = require('winston');
var async = require('async');

winston.level = 'debug';

function updateListOfDevicesInCloud() {
  var sharedDevices = [];
  var cloudDevices = [];
  var oldDevices = [];
  var newDevices = [];
  var gatewayObjects = [];

  winston.log('debug', 'Update list of devices in cloud started');

  async.series([

      function(callback){
        winston.log('debug', 'List of shared devices');

        vicinityManagerServices.getSharedDevices(function(data){
          sharedDevices = data;
          winston.log('debug', 'Call back');
          callback();
        });
      },

      function(callback){
        winston.log('debug', 'List of devics in ExoSite');

        exositeServices.getDevices(function(data){
          cloudDevices = data;
          winston.log('debug', 'Call back');
          callback();
        });
      },

      function(callback){
        winston.log('debug', 'create list of shared devices which needs to be removed');
        oldDevices = updateDevicesServices.getOldDevices(cloudDevices, sharedDevices);
        winston.log('debug', 'devices should be removed: ' + oldDevices.length);
        callback();
      },

      function(callback){
        winston.log('debug', 'create list of shared devices which needs to be added');
        newDevices = updateDevicesServices.getNewDevices(cloudDevices, sharedDevices);
        callback();
      },

      function(callback){
        winston.log('debug', 'remove devices');
        exositeServices.removeDevices(oldDevices, callback);
      },

      function(callback) {
        winston.log('debug', 'add devices');
        exositeServices.addDevices(newDevices, gatewayObjects, callback);
      },

      function(callback) {
        winston.log('debug', 'storing gatewayobejcts');
        updateDevicesServices.storeGatewayObjects(gatewayObjects, callback);
      }
    ],
      function(err){
        if (err) {
          winston.log('error', err.message);
        }
        winston.log('debug', 'updating devices in exosite done!');
      });
}

module.exports.performUpdate = updateListOfDevicesInCloud;
