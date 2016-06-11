var winston = require('winston');
var mysql = require('mysql');
var async = require('async');
var request = require('request');

winston.level = 'debug';


var mysqlPool = mysql.createPool({
  connectionLimit: 100,
  host: 'mysql57.websupport.sk',
  port: '3311',
  user: 'qgxu775m',
  password: 'ueio2PQSRE',
  database: 'qgxu775m',
  debug: false
})

mysqlPool.getConnection(function(err, connection){
  if (err) {
    winston.log('err', 'MySQL: There is problem with connection with MySQL');
    //connection.release();
    winston.log('err', 'MySQL:' + err);
  } else {
    winston.log('info', "MySQL: connection established");
    //connection.release();
  }
});

module.exports.define = function(agenda) {
  agenda.define('process commands', function(job){

    winston.log('info', "Process commmands");

    //TODO: Read values from SELECT

    mysqlPool.getConnection(function(err, connection){

        debugger;
        if (err) {
          winston.log('error', 'Reading from database failed!');
          winston.log('error', 'Error: ' + err.toString());
          callback();
          return;
        }


        connection.query("SELECT * FROM plugwise_last_command ", function(err, rows){
          debugger;
          for (var i in rows){
              winston.log('debug', "mac: %s, timestamp: %s, value: %s", rows[i].mac, rows[i].timestamp, rows[i].value);
          }


          async.forEachSeries(rows, function(row, callback){
            debugger;
            winston.log('debug', 'Inserting command in mysql database!');

            var options = { method: 'POST',
            url: 'http://localhost:9002/service/devices',
            headers:
             { 'content-type': 'application/x-www-form-urlencoded',
               'postman-token': '05d20659-11d8-bc8f-245a-6e8cd2285b99',
               'cache-control': 'no-cache' },
            form: { mac: row.mac, command: row.value } };

            request(options, function (error, response, body) {
              debugger;
              if (error) throw new Error(error);
              winston.log('debug', body);
              callback();
            });
          }, function(err){

          });
          connection.release();
        });


        connection.on('error', function(err){
          winston.log('error', 'Reading from database failed!');
          winston.log('error', 'Error: ' + err.toString());
          //callback();
          return;
        });

    });

    //TODO: Call device commanding service;

  });
}

module.exports.every = function(agenda) {
  //agenda.now('read data');
  agenda.every('5 seconds', 'process commands');
}
