// Global Objects

var mongoose = require('mongoose');
var ce = require('cloneextend');
var itemOp = require('../../models/vicinityManager').item;
var logger = require('../../middlewares/logger');

// Functions

/*
Find in Mongo dB all objects contained in the req.
Return the thingDescriptions
*/
function postSearch(req, res, next){
  var oidArray = req.body.oids;
  logger.debug("Request info:  " + JSON.stringify(req.body) + "    " + JSON.stringify(req.headers));
  itemOp.find({oid: {$in: oidArray } }, {adid:1, oid:1, name:1, info:1} )
    .exec(
      function(err,data){
        if(err || !data){
         res.json({"error" : true, "message" : "No match found"});
        } else {
         logger.debug("Result search: " + JSON.stringify(data)); 
	 res.json({"error": false, "message" : data });
        }
      }
    );
}

// Export Functions

module.exports.postSearch = postSearch;
