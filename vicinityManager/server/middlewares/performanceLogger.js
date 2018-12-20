/*
Logger middleware - replaces node default logger
Writes in console and in text files
The level of verbosity can be customized based on needs
*/

var winston = require('winston');
var config = require("../configuration/configuration");

winston.emitErrs = true;

var myMonitorLevels = {
  levels: {
    metrics: 0
  },
  colors: {
    metrics: 'blue'
  }
};

var profileLogger = new winston.Logger({
    levels: myMonitorLevels.levels,
    colors: myMonitorLevels.colors,
    transports: [
        new winston.transports.File({
            level: 'metrics',
            filename: config.profilerLog || "./logs/profiler_log.log",
            handleExceptions: false,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            prettyPrint: false
        })
    ],
    exitOnError: false
});

module.exports = profileLogger;
