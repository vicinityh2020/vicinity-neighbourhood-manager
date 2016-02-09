var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');


var routes = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');
var userAccounts = require('./routes/userAccounts');
var jwtauth = require('./middlewares/jwtauth');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

mongoose.connect('mongodb://vicinity_user:Ysq.rvE!(wg#Vp4_@ds060478.mongolab.com:60478/vicinity_neighbourhood_manager', function(error){
  if (error){
    console.log("VMModel: Couldn't connect to data source!" + error);
  } else {
    console.log("VMModel: Datasource connection establised!");
  }
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS
//app.use(function(req, res, next) {
//
//  if (req.method === 'OPTIONS') {
//    res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000");
//    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
//    res.setHheader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//    res.send(200);
//  } else {
//    next();
//  }
//
//});


app.use('/', routes);
app.use('/users', users);
app.use('/api', api);
app.use('/useraccounts', [jwtauth, userAccounts]);


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
