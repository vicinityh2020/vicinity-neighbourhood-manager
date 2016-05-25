module.exports.readDataFromCloudAndWriteInIoTs = readDataFromCloudAndWriteInIoTs;

var winston = require('winston');
var tinymServices = require('../tinym/tinymServices');
var certhServices = require('../certh/certhServices');
var isServices = require('../is/isServices');
var exositeService = require('../exosite/exositeServices');

winston.level = "debug" ;

function readDataFromCloudAndWriteInIoTs(){
  winston.log('debug','Start reading data from cloud and write in IoTs');

  var cloudDevices = [];
  //XXX: Get commanded objects in cloud
  cloudDevices = getCloudDevices();
  //XXX: Read data from the commanded objects
  exositeService.readDataFromCommandedDevices(cloudDevices);
  //XXX: Strore data in IoT infrastructures;
  for (var i in cloudDevices){
    if (cloudDevices[i].type === "TINYM"){
      tinymServices.writeCommand(cloudDevices[i]);
    } else if (cloudDevices[i].type === "CERTH") {
      certhServices.writeCommand(cloudDevices[i]);
    } else if (cloudDevices[i].type === "IS") {
      isServices.writeCommand(cloudDevices[i]);
    }
  }

  winston.log('debug','End reading data from cloud and write in IoTs');
}

function getCloudDevices(){
  return [];
}
