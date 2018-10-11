// Global Objects
var itemOp = require('../../models/vicinityManager').item;
var logger = require('../../middlewares/logger');

// Functions

/*
Find in Mongo dB all objects contained in the req.
Return the thingDescriptions
*/
function searchItems(data, callback){
  var oidArray = data.oids;
  itemOp.find({oid: {$in: oidArray } }, {info:1, _id:0} )
    .exec(
      function(err,data){
        if(err){
          callback(true, err);
        } else if(!data){
          callback(true, "No match found");
        } else {
	        callback(false, data);
        }
      }
    );
}

// Export Functions

module.exports.searchItems = searchItems;
