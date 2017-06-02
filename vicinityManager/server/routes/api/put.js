var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var rememberOp = require('../../models/vicinityManager').remember;
var jwt = require('../../helpers/jwtHelper');
var logger = require("../../middlewares/logger");

function updatePwd(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  userOp.update({ "_id": o_id}, {$set: updates}, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
  })
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
    })
  })
}

module.exports.updatePwd = updatePwd;
module.exports.updateCookie = updateCookie;
