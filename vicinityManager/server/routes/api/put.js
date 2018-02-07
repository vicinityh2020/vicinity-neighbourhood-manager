var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var rememberOp = require('../../models/vicinityManager').remember;
var jwt = require('../../helpers/jwtHelper');
var logger = require("../../middlewares/logger");
var bcrypt = require('bcrypt');

function updatePwd(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var pwd = req.body.password;
  var saltRounds = 10;
  var salt = "";
  var hash = "";

  bcrypt.genSalt(saltRounds)
  .then(function(salt){
    return bcrypt.hash(pwd, salt);
  })
  .then(function(hash){
    // Store hash in your password DB.
  var updates = {'authentication.hash': hash, 'authentication.salt': salt};
  return userOp.update({ "_id": o_id}, {$set: updates});
  })
  .then(function(response){
    res.json({"error": false, "message": response});
  })
  .catch(function(err){
    logger.debug(err);
    res.json({"error": true, "message": err});
  });
}

function updateCookie(req, res) {
  var response = {};
  var o_id_cookie = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var decoded = jwt.jwtDecode(req.body.token);
  var o_id_user = mongoose.Types.ObjectId(decoded.uid);
  userOp.findById(o_id_user, function(err, dataUser){  // Load roles from user collection because they may change during a session
    var newToken = jwt.jwtEncode(dataUser.email, dataUser.authentication.principalRoles, decoded.uid, decoded.cid);
    updates.token = newToken.token;
    rememberOp.findByIdAndUpdate(o_id_cookie, {$set: updates}, { new: true }, function(err, data){
      if(!err){
          var response = {"error": err, "message": data};
          res.json(response);
      }
    });
  });
}

module.exports.updatePwd = updatePwd;
module.exports.updateCookie = updateCookie;
