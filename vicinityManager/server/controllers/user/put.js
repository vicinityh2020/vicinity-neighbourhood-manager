var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require("../../models/vicinityManager").user;
var sPutUser = require('../../services/users/putUsers');

function putOne(req, res) {
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  var userMail = req.body.decoded_token.sub;
  var userId = req.body.decoded_token.uid;
  var roles = req.body.decoded_token.roles;
  var cid = req.body.decoded_token.cid;
  var type = req.body.type;

  userOp.findOne({_id:o_id}, {email:1, cid:1}, function(err, response){
    if(err){
      res.json({error: true, message: err, success: false});
    } else if((response.email === userMail) || (response.cid.extid === cid && roles.indexOf('administrator') !== -1)) {
      if(type === 'undefined' || type === ""){
        res.json({error: false, message: 'Type of update not defined...', success: false});
      } else {
        sPutUser.putOne(o_id, updates, userMail, userId, type, function(err,response){
          res.json({error: err, message: response, success: true});
        });
      }
    } else {
      res.json({error: false, message: 'Not authorized to update this user...', success: false});
    }
  });
}

module.exports.putOne = putOne;
