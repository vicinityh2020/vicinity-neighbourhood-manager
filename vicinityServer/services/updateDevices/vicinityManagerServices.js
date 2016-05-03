var winston = require('winston');

winston.level = 'debug';


function getSharedDevices(){
    //TODO: Get shared devices;
    winston.log('debug', 'vicinityManagerService.getSharedDevices');
}



module.exports.getSharedDevices = getSharedDevices;
