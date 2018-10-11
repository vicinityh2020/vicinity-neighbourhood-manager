var fs = require("fs");
var config = require('../../configuration/configuration');

/**
* Get statistics
* @return {Object} JSON with NM statistics
*/
function getStatistics(callback) {
  fs.readFile( config.vicinityServicesDir + "getStatistics/statistics.log", 'utf8', function(err, file){
    if(err || !file){
      var error = err || "File not found";
      callback(true, error);
    } else {
      // Get annotations from annotations service (Updates every day)
      var parsedFile = JSON.parse(file);
      callback(false, parsedFile);
    }
  });
}

module.exports.getStatistics = getStatistics;
