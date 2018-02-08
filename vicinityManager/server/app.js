var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
//var winston = require('winston');

// ROUTES Import
// var users = require('./routes/users');
var api = require('./routes/api');
var audit = require('./routes/audit');
var userAccounts = require('./routes/userAccounts');
var items = require('./routes/items');
var user = require('./routes/user');
var notifications = require('./routes/notifications');
var invitations = require('./routes/invitations');
var registrations = require('./routes/registrations');
var nodes = require('./routes/nodes');
var commServer = require('./routes/commServer');
var search = require('./routes/search');
//var userAccounts = require('./routes/companyAccounts');

// Custom MIDDLEWARES Import === jwauth && Winston Debugger
//var config = require("./configuration/configuration");
var jwtauth = require("./middlewares/jwtauth");
var logger = require("./middlewares/logger");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// MIDDLEWARES ================

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
logger.debug("Overriding 'Express' logger");
app.use(require('morgan')("combined",{ "stream": logger.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/api', api);
app.use('/useraccounts', [jwtauth, userAccounts]);       //      TODO: setup security
app.use('/nodes', [jwtauth, nodes]);
app.use('/items', [jwtauth, items]);  // TODO add JWAUTH back !!!
app.use('/user', [jwtauth, user]);
app.use('/notifications', [jwtauth, notifications]);
app.use('/search', [jwtauth, search]);
app.use('/audit', [audit]);
app.use('/invitations', [invitations]);
app.use('/registrations', [registrations]);
app.use('/commServer', commServer);
//app.use('/usergroups', [jwtauth, userGroups]);

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

// ENDING MIDDLEWARES ================

// CONNECTING to MONGO
mongoose.connect(process.env.VCNT_MNGR_DB, { useMongoClient: true }, function(error){
  if (error){
    logger.error("VMModel: Couldn't connect to data source!" + error);
  } else {
    logger.info("VMModel: Datasource connection established!");
  }
});

module.exports = app;
