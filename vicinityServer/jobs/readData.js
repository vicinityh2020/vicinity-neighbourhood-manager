var readService = require('../services/readData/facade.js');

// module.exports.define = function(agenda){
//   agenda.define('read data', function(job){
//     readService.readDataAndUpdateInCloud();
//   });
// }
//
// module.exports.every = function(agenda) {
//   agenda.every('60 seconds', 'read data');
//   //agenda.now('read data');
// }

module.exports.define = function(agenda) {
  agenda.define('read data', function(job){
    readService.readDataAndUpdateInCloud();
  });
}

module.exports.every = function(agenda) {
  //agenda.now('read data');
  agenda.every('20 seconds', 'read data');
}
