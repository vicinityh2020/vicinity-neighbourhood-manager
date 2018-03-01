var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sPutUser = require('../../services/users/putUsers');

function putOne(req, res) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var userMail = req.body.decoded_token.sub;
  sPutUser.putOne(o_id, updates, userMail, function(err,response){
    res.json({error: err, message: response});
  });
}

function putPassword(req, res){
  var oldPwd = req.body.passwordOld;
  var newPwd = req.body.passwordNew;
  var id = req.params.id;
  sPutUser.putPassword(id, oldPwd, newPwd, function(err,response, success){
    res.json({error: err, message: response, success: success});
  });
}

module.exports.putOne = putOne;
module.exports.putPassword = putPassword;
