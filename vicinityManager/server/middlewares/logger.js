/*
Logger middleware - replaces node default logger
Writes in console and in text files
The level of verbosity can be customized based on needs
*/

var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function(message, encoding){
        logger.info(message.slice(0,-1)); // Remove additional line char
    }
};
