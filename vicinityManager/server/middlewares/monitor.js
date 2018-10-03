var logger = require("../middlewares/logger");
var resourceMonitorMiddlewareCB = require('express-watcher').resourceMonitorMiddlewareCB;

module.exports.responsePerformance = function(req, res, next){
  resourceMonitorMiddlewareCB(req, res, next, function(diffJson){
      // logger.debug(' diffJson : ', diffJson);
   });
};
