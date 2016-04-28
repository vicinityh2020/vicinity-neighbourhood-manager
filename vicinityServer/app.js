var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var updateDevicesJob = require('./jobs/updateDevices.js');
var readDataJob = require('./jobs/readData.js');
var writeDataJob = require('./jobs/writeData.js');

var Agenda = require('agenda');
var Agendash = require('agendash');

var app = express();

var agenda = new Agenda({db: {address: "mongodb://vicinity_user:Ysq.rvE!(wg#Vp4_@ds060478.mongolab.com:60478/vicinity_neighbourhood_manager"}});

updateDevicesJob.define(agenda);
readDataJob.define(agenda);
writeDataJob.define(agenda);

agenda.on('ready', function(){
  console.log('Agenda connected to mongodb');
  updateDevicesJob.every(agenda);
  readDataJob.every(agenda);
  writeDataJob.every(agenda);
  agenda.start();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/agendash', Agendash(agenda));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

function graceful() {
  console.log('Stoping agenda!');
  agenda.stop(function() {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);
