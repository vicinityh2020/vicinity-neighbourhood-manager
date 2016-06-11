var winston = require('winston');
var request = require('request');

winston.level = 'debug';


function getSharedDevices(callback){
      //TODO: Get shared devices;
      winston.log('debug', 'vicinityManagerService.getSharedDevices');

      winston.log('debug', 'Get authentication token');

      var options = { method: 'POST',
        url: process.env.VCNT_MNGR_API + '/api/authenticate',
        headers:
         { 'postman-token': 'b458c901-d60b-3206-5d77-c0e59a1c1519',
           'cache-control': 'no-cache',
           'content-type': 'application/json' },
        body: { username: process.env.VCNT_MNGR_USR, password: process.env.VCNT_MNGR_PWD}, json: true};

      request(options, function (error, response, body) {
        if (error) {
          debugger;
          throw new Error(error);
        }

          winston.log('debug', body);

          var token = body.message.token;
          options = { method: 'GET',
            url: process.env.VCNT_MNGR_API + '/useraccounts/573c3140b2d85fed305b9457/neighbourhood?hasAccess=1',
            headers:
             { 'postman-token': '50d8e149-d99b-2094-b376-69aa146b250c',
               'cache-control': 'no-cache',
               'content-type': 'application/json',
               'x-access-token': token } };
         request(options, function (error, response, body) {
           if (error) throw new Error(error);
           callback(JSON.parse(body).message);
         });
      });

    }



module.exports.getSharedDevices = getSharedDevices;
