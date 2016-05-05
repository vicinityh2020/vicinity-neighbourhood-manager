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
           'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ2aWNpbml0eU1hbmFnZXIiLCJzdWIiOiJ3YWRlLndpbHNvbkBiYXZlbmlyLmV1IiwiZXhwIjoxNDYyNDU1MTg2MzQwLCJyb2xlcyI6WyJ1c2VyIiwiYWRtaW5pc3RyYXRvciJdLCJjb250ZXh0Ijp7Im5hbWUiOiJ3YWRlLndpbHNvbkBiYXZlbmlyLmV1IiwiaWQiOiI1NmJkZWFmZmEwOWQ2YTNmMWNlZTJkMGYifX0.G9Mfjn3NpoarI-CuwiHBwoZkg0vB6xl8Su4VZ3zMCFA' } };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        callback(JSON.parse(body));
      });

    }



module.exports.getSharedDevices = getSharedDevices;
