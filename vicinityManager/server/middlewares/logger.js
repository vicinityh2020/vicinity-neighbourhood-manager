/*
Logger middleware - replaces node default logger
Writes in console and in text files
The level of verbosity can be customized based on needs
*/

var winston = require('winston');
winston.emitErrs = true;

var myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    audit: 2,
    info: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    audit: 'green',
    info: 'black',
    debug: 'blue'
  }
};

var logger = new winston.Logger({
    levels: myCustomLevels.levels,
    colors: myCustomLevels.colors,
    transports: [
        // new winston.transports.File({
        //     level:'info',
        //     filename: './logs/all-logs.log',
        //     handleExceptions: false,
        //     json: true,
        //     maxsize: 5242880, //5MB
        //     maxFiles: 5,
        //     colorize: false,
        //     prettyPrint: true,
        // }),
        new winston.transports.File({
            level: 'audit',
            filename: './logs/technical_log.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            prettyPrint: true
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true, // we capture them as a type
            json: false,
            colorize: true,
            prettyPrint: true
        })
    ],
    exitOnError: false
});

// process.on('uncaughtException', function (err) {
//     logger.uncaughtException({ message : err.message, stack : err.stack }); // logging with MetaData
//     // process.exit(1); // exit with failure
// });

module.exports = logger;

module.exports.stream = {
    write: function(message, encoding){
        logger.info(message.slice(0,-1)); // Remove additional line char
    }
};
