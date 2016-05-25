var winston = require('winston');
var request = require('request');

winston.level = 'debug';


function getSharedDevices(callback){
      //TODO: Get shared devices;
      winston.log('debug', 'vicinityManagerService.getSharedDevices');

      var options = { method: 'GET',
        url: 'http://localhost:3000/useraccounts/573c3140b2d85fed305b9457/neighbourhood?hasAccess=1',
        headers:
         { 'postman-token': '50d8e149-d99b-2094-b376-69aa146b250c',
           'cache-control': 'no-cache',
           'content-type': 'application/json',
           'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ2aWNpbml0eU1hbmFnZXIiLCJzdWIiOiJvcm9yby5tdW5yb2VAYmF2ZW5pci5ldSIsImV4cCI6MTQ2NDcwMTIyNTgyNiwicm9sZXMiOlsidXNlciIsImFkbWluaXN0cmF0b3IiXSwiY29udGV4dCI6eyJuYW1lIjoib3Jvcm8ubXVucm9lQGJhdmVuaXIuZXUiLCJ1aWQiOiI1NzI3MGI5NTY0MTE0Y2Y2MDM3NTU1ODMiLCJjaWQiOiI1NzNjMzE0MGIyZDg1ZmVkMzA1Yjk0NTcifX0.wPTQzosVRc0u-mayK2-4ScFYbVH7uMAIsvB_7Jz7ftc' } };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        callback(JSON.parse(body).message);
      });

    }



module.exports.getSharedDevices = getSharedDevices;
