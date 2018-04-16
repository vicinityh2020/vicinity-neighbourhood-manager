// Global objects and variables
var sItemUpdate = require('../../services/items/update');
var logger = require("../../middlewares/logger");
var mongoose = require('mongoose');

/*
Controls any possible object modification
- Change of status Enable/Disable
- Change of other properties
- Change of accessLevel
*/
function putOne(req, res) {
  var email = req.body.decoded_token.sub;
  var cid = req.body.decoded_token.cid;
  var c_id = req.body.decoded_token.orgid;
  var uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);

  if(req.body.multi){
   sItemUpdate.updateManyItems(req.body.items, req.body.decoded_token.roles, email, cid, c_id, uid, function(err, response, success){
    res.json({error: err, message: response, success: success});
   });
  }else if(req.body.status === 'enabled'){
    sItemUpdate.enableItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }else if(req.body.status === 'disabled'){
    sItemUpdate.disableItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }else{
    sItemUpdate.updateItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }
}

// Module exports
module.exports.putOne = putOne;
