var jwt = require('jwt-simple');
var config = require('../helpers/configuration');
var logger = require("../middlewares/logger");

module.exports = function(req, res, next) {
  logger.info('JWTAuth middleware');

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

  if (token) {
    try {
      var decoded = jwt.decode(token, config.jwtTokenSecrete);
      if (decoded.exp <= Date.now()) {
        res.end('access token has expired', 400);
      } else {
        req.body.token = token;
        req.body.decoded_token = decoded;

        return next();
      }
    } catch (err) {
      logger.info("JWT Validation error: " + err.text);
      return res.send(401);
    }
  } else {
    return res.send(401);
  }
  logger.info('JWTAuth done');
};
