var jwt = require('jwt-simple');
var config = require('../configuration/configuration');
var logger = require("../middlewares/logBuilder");

module.exports = function(req, res, next) {

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

  if (token) {
    try {
      var decoded = jwt.decode(token, config.jwtTokenSecret);
      if (decoded.exp <= Date.now()) {
        res.end('access token has expired', 400);
      } else {
        req.body.token = token;
        req.body.decoded_token = decoded;
        return next();
      }
    } catch (err) {
      logger.log(req, res, {type: 'error', data: "JWT Validation error: " + err.text});
      return res.sendStatus(401);
    }
  } else {
    logger.log(req, res, {type: 'debug', data: "No token!!"});
    return res.sendStatus(401);
  }
  // logger.log(req, res, {type: 'info', data: "JWTAuth done"});
};
