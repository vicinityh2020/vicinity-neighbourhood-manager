var winston = require('winston');
var request = require('request');

winston.level = 'debug';


function getSharedDevices(callback){
      //TODO: Get shared devices;
      winston.log('debug', 'vicinityManagerService.getSharedDevices');

      var options = { method: 'GET',
        url: 'http://localhost:3000/useraccounts/57270b9564114cf603755581/neighbourhood',
        headers:
         { 'postman-token': '50d8e149-d99b-2094-b376-69aa146b250c',
           'cache-control': 'no-cache',
           'content-type': 'application/json',
           'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ2aWNpbml0eU1hbmFnZXIiLCJzdWIiOiJuZXcud2FkZS53aWxzb25AYmF2ZW5pci5ldSIsImV4cCI6MTQ2Mzk4ODMzNDk3MSwicm9sZXMiOlsidXNlciIsImFkbWluaXN0cmF0b3IiXSwiY29udGV4dCI6eyJuYW1lIjoibmV3LndhZGUud2lsc29uQGJhdmVuaXIuZXUiLCJ1aWQiOiI1NzIyZmQyMzE2ZjljYzE0NDY2NTE5NDgiLCJjaWQiOiI1NzIyZmQyMjE2ZjljYzE0NDY2NTE5NDUifX0.UrKrXLgyzIa10UHCkW7x7knDllNasTe1YPoIyBUWceg' } };

      request(options, function (error, response, body) {
        var data = {};
        if (error) throw new Error(error);
        callback(JSON.parse(body).message);
      });

    }



module.exports.getSharedDevices = getSharedDevices;
