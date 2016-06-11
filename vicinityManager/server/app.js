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

//var userAccounts = require('./routes/companyAccounts');


var userGroups = require('./routes/userGroups');
var organisationUnits = require('./routes/organisationUnits');
var gateways = require('./routes/gateways');
var items = require('./routes/items');
//var search = require('./routes/search');
var jwtauth = require('./middlewares/jwtauth');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

mongoose.connect(process.env.VCNT_MNGR_DB, function(error){
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

//app.use('/', routes);
//app.use('/users', users);
app.use('/api', api);
app.use('/useraccounts', [jwtauth, userAccounts]);

//app.use('/companyaccounts', [jwtauth, userAccounts]);
//app.use('/usergroups', [jwtauth, userGroups]);
//app.use('/organisationUnits', [jwtauth, organisationUnits]);
app.use('/gateways', [jwtauth, gateways]);
app.use('/items', [jwtauth, items]);



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
