var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require("../../models/vicinityManager").user;
var sPutUser = require('../../services/users/putUsers');

function putOne(req, res) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var userMail = req.body.decoded_token.sub;
  var roles = req.body.decoded_token.roles;
  var cid = req.body.decoded_token.cid;

  userOp.findOne({_id:o_id}, {email:1, cid:1}, function(err, response){
    if(err){
      res.json({error: true, message: err, success: false});
    } else if((response.email === userMail) || (response.cid.extid === cid && roles.indexOf('administrator') !== -1)) {
      sPutUser.putOne(o_id, updates, userMail, function(err,response){
        res.json({error: err, message: response, success: true});
      });
    } else {
      res.json({error: true, message: 'Not authorized to update this user', success: false});
    }
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
