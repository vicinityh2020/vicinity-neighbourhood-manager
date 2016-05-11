var readService = require('../services/readData/facade.js');

module.exports.define = function(agenda){
  agenda.define('read data', function(job){
    readService.readDataAndUpdateInCloud();
  });
}

module.exports.every = function(agenda) {
  //agenda.every('10 seconds', 'read data');
    agenda.now('read data');
}
