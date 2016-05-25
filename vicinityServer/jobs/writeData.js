
var winston  = require('winston');

var writeData = require('../services/writeData/writeDataService');

winston.level = 'debug';


module.exports.define = function(agenda) {
  agenda.define('write data', function(job){
    writeData.readDataFromCloudAndWriteInIoTs();
  });
}

module.exports.every = function(agenda) {
  //agenda.every('10 seconds', 'write data');
  agenda.now('write data');
}
