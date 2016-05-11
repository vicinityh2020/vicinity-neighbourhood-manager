var winston = require('winston');
var tinym = require('../tinym/tinymServices.js');
var is = require('../is/isServices.js');
var certh = require('../certh/certhServices.js');
var exosite = require('../exosite/exositeServices.js');
var async = require('async');

winston.level = 'debug';

function readDataAndUpdateInCloud(){
  winston.log('debug','Start: Read data and update in cloud!');
  var gatewayObjects = [];
  var tinymData = [];
  var isData = [];
  var certData = [];

  async.series(
    [function(callback){
      winston.log('debug', 'Getting list of devices shared in Exosite');
      getGatewayObjects(gatewayObjects, callback);
    },
    function(callback){
      //XXX: Read data from TINYM devices
      winston.log('debug', 'Reading data from TINYM devices');
      tinym.getData(gatewayObjects, callback);
    },
    function(callback){
      //XXX: Read data from IS IoT
      winston.log('debug', 'Reading data from IS devices');
      is.getData(gatewayObjects, callback);
    },
    function(callback){
      //XXX: Read data form CERT
      winston.log('debug', 'Reading data from CERT devices');
      certh.getData(gatewayObjects, callback);
    },
    function(callback){
      //XXX: Writing data to exosite datasources
      winston.log('debug', 'Writing data to exosite');
      exosite.writeData(gatewayObjects, callback);
    }],

    function(callback){
      callback();
    }
  );

  winston.log('debug', 'End: Read data and update in cloud!');
}

function getGatewayObjects(gatewayObjects, callback){
  //XXX: Get list of devices in Exosite from gatewayObjects
  winston.log('debug', 'Start: Getting list of gateway objects!');
  winston.log('debug', 'End: Getting list of gateway objects!');
  callback();
}


module.exports.readDataAndUpdateInCloud = readDataAndUpdateInCloud
