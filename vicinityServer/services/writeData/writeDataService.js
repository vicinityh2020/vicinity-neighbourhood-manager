module.exports.readDataFromCloudAndWriteInIoTs = readDataFromCloudAndWriteInIoTs;

var winston = require('winston');
var tinymServices = require('../tinym/tinymServices');
var certhServices = require('../certh/certhServices');
var isServices = require('../is/isServices');
var exositeService = require('../exosite/exositeServices');
var gatewayobjectOp = require('../../data/model').gatewayobject;
var async = require('async');


winston.level = "debug" ;

function readDataFromCloudAndWriteInIoTs(){
  winston.log('debug','Start reading data from cloud and write in IoTs');
  async.waterfall([
    //XXX: Get commanded objects in cloud
    getCloudDevices,
    //XXX: Read data from the commanded objects
    exositeService.readDataFromCommandedDevices
  ],
    function(err, cloudDevices){
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
    }
  );

  winston.log('debug','End reading data from cloud and write in IoTs');
}

function getCloudDevices(callback){

  winston.log('debug', 'Reading cloud devices');
  gatewayobjectOp.find({data_sources: {$elemMatch: {controllable: "true"}}},function(err, data){
    winston.log('debug', "Read cloud %d devices", data.length);
    callback(err, data);
  });
}
