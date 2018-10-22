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
  sLogin.authenticate(req, res, function(err, response, data){
    if(err){
      res.json({error: err, message: response});
    } else {
      if(res.statusCode < 400){
        response.uid = data.uid;
        response.cid = data.cid;
      }
      res.json({error: err, message: response});
    }
  });
};
