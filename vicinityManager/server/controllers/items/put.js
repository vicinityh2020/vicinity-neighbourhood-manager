// Global objects and variables
var sItemUpdate = require('../../services/items/update');
var logger = require("../../middlewares/logBuilder");

/*
Controls any possible object modification
- Change of status Enable/Disable
- Change of other properties
- Change of accessLevel
*/
function putOne(req, res) {

  if(req.body.multi){
   sItemUpdate.updateManyItems(req, res, function(value, err, success, response){
    res.json({error: err, message: response, success: success, id: value});
   });
  }else if(req.body.status === 'enabled'){
    sItemUpdate.enableItem(req, res, function(value, err, success, response){
      res.json({error: err, message: response, success: success, id: value});
    });
  }else if(req.body.status === 'disabled'){
    sItemUpdate.disableItem(req, res, function(value, err, success, response){
      res.json({error: err, message: response, success: success, id: value});
    });
  }else{
    sItemUpdate.updateItem(req, res, function(value, err, success, response){
      res.json({error: err, message: response, success: success, id: value});
    });
  }
}

// Module exports
module.exports.putOne = putOne;
