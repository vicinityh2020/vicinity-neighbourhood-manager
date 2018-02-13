// Global objects and variables
var sItemUpdate = require('../../services/items/update');
var logger = require("../../middlewares/logger");

/*
Controls any possible object modification
- Change of status Enable/Disable
- Change of other properties
- Change of accessLevel
*/
function putOne(req, res) {
  // logger.debug(req.body);
  if(req.body.status === 'enabled'){
    sItemUpdate.enableItems(req.body, function(err, response){
      res.json({error: err, message: response});
    });
  }else if(req.body.status === 'disabled'){
    sItemUpdate.disableItems(req.body, function(err, response){
      res.json({error: err, message: response});
    });
  }else{
    sItemUpdate.updateItems(req.body, function(err, response){
      res.json({error: err, message: response});
    });
  }
}

// Module exports
module.exports.putOne = putOne;
