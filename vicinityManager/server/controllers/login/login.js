// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sLogin = require('../../services/login/login');

// Main functions - Login process

/* Check user and password. */
function authenticate(req, res, next) {
  var userName = req.body.username;
  var userRegex = new RegExp("^" + userName.toLowerCase(), "i");
  var pwd = req.body.password;
  sLogin.authenticate(userName, userRegex, pwd, function(err, response){
    res.json({error: err, message: response});
  });
}

/* Recover password - Sends link to the provided mail */
function findMail(req, res, next) {
  var userName = req.body.username;
  sLogin.findMail(userName, function(err, response){
    res.json({error: err, message: response});
  });
}

/* Stores cookie in MONGO for the Remember Me functionality */
function rememberCookie(req, res, next) {
  var token = req.body.token;
  sLogin.rememberCookie(token, function(err, response){
    res.json({error: err, message: response});
  });
}


function updatePwd(req, res) {
  sLogin.updatePwd(req.params.id, req.body.password, function(err, response){
    res.json({error: err, message: response});
  });
}

function updateCookie(req, res) {
  var o_id_cookie = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  sLogin.updateCookie(o_id_cookie, req.body.token, updates, function(err, data){  // Load roles from user collection because they may change during a session
    res.json({error: err, message: data});
  });
}

// Export functions

module.exports.authenticate = authenticate;
module.exports.findMail = findMail;
module.exports.rememberCookie = rememberCookie;
module.exports.updatePwd = updatePwd;
module.exports.updateCookie = updateCookie;
