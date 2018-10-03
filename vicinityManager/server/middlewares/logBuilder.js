var logger = require("../middlewares/logger");

module.exports.customLogs = function(req, res, next){
  var message;
  var date = new Date().toISOString();
  if(req.url !== "/notifications/"){
    if(!res.statusCode || res.statusCode > 400){
      message = req.headers.origin + " : " + date + " : " + req.method + " : " + req.headers.host + req.url + " : " + res.statusCode + " : " + req.headers["user-agent"];
      logger.error(message);
      next();
    } else {
      message = req.headers.origin + " : " + date + " : " +  req.method + " : " + req.headers.host + req.url + " : " + res.statusCode + " : " + req.headers["user-agent"];
      logger.info(message);
      next();
    }
  }
};
