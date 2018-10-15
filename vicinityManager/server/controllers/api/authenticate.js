// Global variables

var logger = require("../../middlewares/logBuilder");
var sLogin = require("../../services/login/login");

/**
 * Authenticates a user. Check user and password.
 *
 * @param {Object} data
 * password, userName
 * @return {String} token
 */
exports.authenticate = function(req, res, next) {
  sLogin.authenticate(req, res, function(err, response){
    if(err){
      logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
    } else {
      response.uid = req.decoded_token.sub;
      response.cid = req.decoded_token.cid;
      res.json({error: err, message: response});
    }
  });
};
