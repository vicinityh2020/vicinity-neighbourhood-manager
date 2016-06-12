module.exports.getData = getData;
module.exports.writeCommand = writeCommand;

var winston = require('winston');
var request = require('request');
var async = require('async');
var mysql = require('mysql');

winston.level = 'debug';

var mysqlPool = mysql.createPool({
  connectionLimit: process.env.VCNT_SRVR_MYSQL_CONL,
  host: process.env.VCNT_SRVR_MYSQL_HOST,
  port: process.env.VCNT_SRVR_MYSQL_PORT,
  user: process.env.VCNT_SRVR_MYSQL_USER,
  password: process.env.VCNT_SRVR_MYSQL_PWD,
  database: process.env.VCNT_SRVR_MYSQL_DB,
  debug: process.env.VCNT_SRVR_MYSQL_DBG
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

function getData(gatewayObjects, callback){
  winston.log('debug', 'Start: Reading data from IS infrastructure');
  winston.log('debug', 'GatewayObjects being processed: ' + gatewayObjects.length);
  async.forEachSeries(gatewayObjects, function(gatewayObject, device_callback){
    if (gatewayObject.type == "IS") {
      winston.log('debug','Processing device: ' + gatewayObject.device_id.toString());
      winston.log('debug','Processing device: ' + gatewayObject.info.id_value.toString());
      if (process.env.IS_RUN_REMOTE){
        winston.log('debug', 'Processing devices from mysql database');

        mysqlPool.getConnection(function(err, connection){

            if (err) {
              winston.log('error', 'Reading from database failed!');
              winston.log('error', 'Error: ' + err.toString());
              device_callback();
              return;
            }

            connection.query("SELECT * FROM qgxu775m.plugwise_last_seen where mac='" +
              gatewayObject.info.id_value + "'",
              function(err, rows){
                if (!err){
                  for (var j in gatewayObject.data_sources){
                    winston.log('debug','Processing data source: ' + gatewayObject.data_sources[j].name);
                    if (gatewayObject.data_sources[j].name === "Power consumption"){
                        gatewayObject.data_sources[j].data =
                          { timestamp : rows[0].timestamp,
                            value: rows[0].value};

                        winston.log('debug','Timestamp: %s Value: %s',
                          gatewayObject.data_sources[j].data.timestamp,
                          gatewayObject.data_sources[j].data.value);
                    }
                  }
                  connection.release();
                  device_callback();
                }

              });

            connection.on('error', function(err){
              winston.log('error', 'Reading from database failed!');
              winston.log('error', 'Error: ' + err.toString());
              debugger;
              return;
            });

        });
      } else {
        winston.log('debug', 'Processing devices from REST API');

        var options = { method: 'GET',
          url: 'http://localhost:9002/service/devices/' + gatewayObject.info.id_value,
          headers:
           { 'postman-token': 'b4c869b2-4838-7524-4156-b72e5bbd4b9b',
             'cache-control': 'no-cache' } };

        request(options, function (error, response, body) {
          if (error) {
            winston.log('error', error.message);
            device_callback();
          } else {
            winston.log('debug', body);

            var data = JSON.parse(body);

            winston.log('debug', data);


            for (var j in gatewayObject.data_sources){
              winston.log('debug','Processing data source: ' + gatewayObject.data_sources[j].name);
              if (gatewayObject.data_sources[j].name === "Power consumption"){
                  gatewayObject.data_sources[j].data =
                    { timestamp : data['last-seen'].timestamp,
                      value: data['last-seen'].value};

                  winston.log('debug','Timestamp: %s Value: %s',
                    gatewayObject.data_sources[j].data.timestamp,
                    gatewayObject.data_sources[j].data.value);
              } /* else if (gatewayObject.data_sources[j].name === "Switch status") {
                gatewayObject.data_sources[j].data =
                  { timestamp : data['last-seen'].timestamp,
                    value: (data['last-seen'].value == "0") ? "Off" : "On"};
              } */

            }
            device_callback();
          }

        });
      }

    } else {
      device_callback();
    }
  }, function(err){
    if (err){
      winston.log('error', err.message);
    }
    callback();
  });

  winston.log('debug', 'End: Reading data from CERTH infrastructure');
}

function writeCommand(device){
  winston.log('debug', 'Start: Write command in device' + device.info.id_value);

    async.forEachSeries(device.data_sources, function(dataSource, callback){
      if (dataSource.controllable == 'true') {

        if (process.env.IS_RUN_REMOTE){

          winston.log('debug', 'Inserting command in mysql database!');

          mysqlPool.getConnection(function(err, connection){

              if (err) {
                winston.log('error', 'Reading from database failed!');
                winston.log('error', 'Error: ' + err.toString());
                callback();
                return;
              }


              connection.query("SELECT COUNT(mac) as inserted FROM plugwise_last_command WHERE mac='"
              + device.info.id_value + "'", function(err, rows){
                if (rows[0].inserted == 1){
                  winston.log('debug', 'Updating values in MySQL');
                  update_query = "UPDATE plugwise_last_command SET timestamp='" + dataSource.timestamp + "', value='" + dataSource.value + "' WHERE mac='" + device.info.id_value  + "'";
                  winston.log('debug', 'UPDATE SQL: ' + update_query);
                  connection.query(update_query,
                    function(err, rows){
                        callback();
                        return;
                    })
                } else {
                  winston.log('debug', 'Inserting values in MySQL');
                  insert_query = "INSERT INTO plugwise_last_command (mac, timestamp, value) VALUES ('" + device.info.id_value + "', '" + dataSource.timestamp + "', '" + dataSource.value + "')";
                  winston.log('debug', 'Insert QUERY: ' + insert_query);
                  connection.query(insert_query,
                    function(err, rows){
                      callback();
                      return;
                    }
                  );
                }
                connection.release();
              })


              connection.on('error', function(err){
                winston.log('error', 'Reading from database failed!');
                winston.log('error', 'Error: ' + err.toString());
                //callback();
                return;
              });

          });
        } else {

          winston.log('debug', 'Inserting command in mysql database!');

          var options = { method: 'POST',
          url: 'http://localhost:9002/service/devices',
          headers:
           { 'content-type': 'application/x-www-form-urlencoded',
             'postman-token': '05d20659-11d8-bc8f-245a-6e8cd2285b99',
             'cache-control': 'no-cache' },
          form: { mac: device.info.id_value, command: dataSource.value } };

          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            winston.log('debug', body);
            callback();
          });
        }
      } else {
        callback();
      }


    }, function(err){

    });

  winston.log('debug', 'End: Write command in device');
}
