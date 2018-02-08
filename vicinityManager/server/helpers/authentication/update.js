var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var rememberOp = require('../../models/vicinityManager').remember;
var jwt = require('../../helpers/jwtHelper');
var logger = require("../../middlewares/logger");
var bcrypt = require('bcrypt');

function updatePwd(id, pwd, callback) {
  var o_id = mongoose.Types.ObjectId(id);
  var saltRounds = 10;
  var salt = "";
  var hash = "";

  bcrypt.genSalt(saltRounds)
  .then(function(response){
    salt = response.toString('hex');
    return bcrypt.hash(pwd, salt);
  })
  .then(function(response){
    // Store hash in your password DB.
    hash = response;
    var updates = {'authentication.hash': hash}; // Stores salt & hash in the hash field
    return userOp.update({ "_id": o_id}, {$set: updates});
  })
  .then(function(response){
    callback(false, response);
  })
  .catch(function(err){
    logger.debug(err);
    callback(true, err);
  });
}

module.exports.updatePwd = updatePwd;
