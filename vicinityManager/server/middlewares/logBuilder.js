var logger = require("../middlewares/logger");
var pLogger = require("../middlewares/performanceLogger");
var config = require("../configuration/configuration");

/**
* Modify request logs before sending to log file
* @param {Object} req
* @param {Object} res
* @param {Object} next
* @return {Object} next
*/
module.exports.customLogs = function(req, res, next){
  var message;
  var date = new Date().toISOString();
  if(req.url !== "/notifications/"){
    if(!req.headers){
      req.headers = {};
      req.headers.host = "N/A";
      req.headers.origin = "N/A";
      req.headers["user-agent"] = "N/A";
    }
    if(!res.statusCode || res.statusCode > 400){
      message = req.headers.origin + " : " + date + " : " + req.method + " : " + req.headers.host + req.url + " : " + res.statusCode + " : " + req.headers["user-agent"];
      logger.error(message);
      next();
    } else {
      message = req.headers.origin + " : " + date + " : " +  req.method + " : " + req.headers.host + req.url + " : " + res.statusCode + " : " + req.headers["user-agent"];
      logger.info(message);
      next();
    }
  } else {
    next();
  }
};

/**
* Create profile log
* @param {Object} req
* @param {Object} res
* @param {Object} data
* @return {Object} next
*/
module.exports.profilerLogs = function(req, res, data){
  var message;
  // var date = data.timestamp.toISOString();
  message = req.method + " : " + res.statusCode + " : " + req.headers.host + req.url + " : " + data.log;
  pLogger.metrics(message);
  return true;
};


/**
* Custom logging
* @param {Object} req
* @param {Object} res
* @param {Object} body
* @return {Boolean}
*/
module.exports.log = function(req, res, body){
  if(process.env.env === 'test') return true;
  if(req && res){
    try{
      if(body.type === undefined){
        body.type = "error";
        body.data = "No log type defined";
      }
      if (config.env !== "dev" && body.type === "debug") return false;
      if (body.type === "info") return false;
      var parsedBody;
      if (body.type === "error") {
        // Custom errors are strings
        if(typeof body.data !== 'object'){
          parsedBody = body.data;
        } else if(body.data.stack === undefined){
        // For unknown errors return whole object
          logger.error(body.data);
          return false;
        } else {
        // Control case "unexpected error" type, return only stack
          parsedBody = body.data.stack;
        }
      } else if(body.type === "debug" && typeof body.data === 'object'){
      // For test debug messages that return objects, see whole item
        logger.debug(body.data);
        return false;
      } else {
        // Control case payload is an object, stringify with right format
        // Only audit and warn types
        parsedBody = typeof body.data === 'object' ? JSON.stringify(body.data) : body.data;
      }
      var message = createMessage(req, res, parsedBody);
      sendLog(body.type, message);
      return true;
    } catch(err) {
      logger.error("Logger error: " + err);
      return false;
    }
  } else {
    logger.warn("Missing req and res objects");
    return true;
  }
};

// PRIVATE FUNCTIONS

// Check if req and res objects are available and replace undefined
// Creates payload of the log with available info
function createMessage(req, res, body){
  var result;
  var date = new Date().toISOString();
  var info = {};
  info.origin = req.headers ? req.headers.origin : "N/A";
  info.status = res.statusCode || "N/A";
  info.url = req.url || "N/A";
  result = info.origin + " : " + date +  " : " + info.url + " : " + info.status + " : [ " + body + " ]";
  return result;
}

// Send log based on the type
function sendLog(type, message){
  switch(type){
    case "error":
      logger.error(message);
      break;
    case "debug":
      logger.debug(message);
      break;
    case "audit":
      logger.audit(message);
      break;
    case "warn":
      logger.warn(message);
      break;
   case "info":
      break;
    default:
      logger.error("Logger error: unknown log type");
    }
  }

  // If the body is an object, return with right format as a string
  function parseBody(body){
    try{
      var result = "";
      for (var key in body) {
        if(body.hasOwnProperty(key)) {
          result = result + key + " - " + body[key] + " : ";
        }
      }
      result = result.slice(0, -3);
      return result;
    }catch(err){
      logger.error(err);
      return("Logger error: Problem parsing payload");
    }
  }
