var logger = require("../middlewares/logger");
var resourceMonitorMiddlewareCB = require('express-watcher').resourceMonitorMiddlewareCB;

module.exports.responsePerformance = function(req, res, next){
  if( req.url !== "/notifications/" ){
    resourceMonitorMiddlewareCB(req, res, next, function(diffJson){
        // logger.debug(' diffJson : ', diffJson);
     });
   } else {
     next();
   }
};
