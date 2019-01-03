// Node JS main file

// Add this to the VERY top of the first file loaded in your app
/* Options configured as env variables
ELASTIC_APM_USE
ELASTIC_APM_SERVICE_NAME
ELASTIC_APM_SECRET_TOKEN
ELASTIC_APM_SERVER_URL
*/
if(process.env.ELASTIC_APM_USE === "true") var apm = require('elastic-apm-node').start();

var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var helmet = require("helmet"); // Forcing SSL
//var winston = require('winston');

// ROUTES Import
var login = require('./routes/login');
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
var infrastructure = require('./routes/infrastructure');

// Custom MIDDLEWARES Import === jwauth && Winston Debugger
var jwtauth = require("./middlewares/jwtauth");
var logger = require("./middlewares/logger");
var logs = require("./middlewares/logBuilder");

var app = express();

// MIDDLEWARES ================

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
// app.set('view engine', 'pug'); // Default view engine
if (process.env.env !== 'test') app.use(logs.customLogs); // Custom logger, if NO test
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet()); // Comment if no SSL

/*
Endpoints
*/

// Public API - TODO Oauth/JWT
app.use('/api', api);
// Agent endpoints through comm server
app.use('/commServer', commServer);
// App endpoints
app.use('/login', login);
app.use('/useraccounts', [jwtauth, userAccounts]);
app.use('/nodes', [jwtauth, nodes]);
app.use('/items', [jwtauth, items]);
app.use('/user', [jwtauth, user]);
app.use('/notifications', [jwtauth, notifications]);
app.use('/search', [jwtauth, search]);
app.use('/audit', [jwtauth, audit]);
app.use('/invitations', [invitations]);
app.use('/registrations', [registrations]);
app.use('/infrastructure', [jwtauth, infrastructure]);

/*
Error and not found handlers
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({ error: true, message: err });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({ error: true, message: err });
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

// Export app module

module.exports = app;
