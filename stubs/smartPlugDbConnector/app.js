var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var processCommandJob = require('./jobs/processCommand.js');
var winston = require('winston');
var Agenda = require('agenda');
var Agendash = require('agendash');
var mongoose = require('mongoose');
var app = express();

var agenda = new Agenda({db: {address: process.env.VCNT_MNGR_DB, collection: "smartPlugDbConnectorJobs"},
                          maxConcurrency: 1,
                          defaultConcurrency: 1});

mongoose.connect(process.env.VCNT_MNGR_DB, function(error){
  if (error){
    winston.log('debug', "VMModel: Couldn't connect to data source!" + error);
  } else {
    winston.log('debug', "VMModel: Datasource connection establised!");
  }
});

processCommandJob.define(agenda);

agenda.on('ready', function(){
  winston.log('debug', 'Agenda connected to mongodb');
  processCommandJob.every(agenda);
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
  app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

function graceful() {
  winston.log('debug', 'Stoping agenda!');
  agenda.stop(function() {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);
