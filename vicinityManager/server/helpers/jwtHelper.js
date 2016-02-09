var jwt = require('jwt-simple');
var config = require('./configuration');
var moment = require('moment');

module.exports.jwtEncode = function(username, roles){
  
    debugger;
    var key = config.jwtTokenSecrete;
    var expires = moment().add(7, 'days').valueOf();
    var token = jwt.encode({iss: username, exp: expires, roles: roles}, config.jwtTokenSecrete);
    var response ={
      token: token,
      expires: expires,
      username: username};
    return response;
  }

module.exports.jwtDecode = function(token) {
  try {
    return jwt.decode(token, config.jwtTokenSecrete);
  } catch (err) {
    return "inValid";
  }
}