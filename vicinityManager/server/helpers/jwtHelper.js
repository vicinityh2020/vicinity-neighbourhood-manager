var jwt = require('jwt-simple');
var config = require('./configuration');
var moment = require('moment');

module.exports.jwtEncode = function(username, roles, userAccountId){
    
    var key = config.jwtTokenSecrete;
    var expires = moment().add(7, 'days').valueOf();
    var token = jwt.encode({
        iss: 'vicinityManager',
        sub: username,
        exp: expires,
        roles: roles,
        context: {name: username, id: userAccountId}
    }, config.jwtTokenSecrete);
    var response ={
      token: token,
      expires: expires,
      username: username,
      userAccountId: userAccountId};
    return response;
  };

module.exports.jwtDecode = function(token) {
  try {
    return jwt.decode(token, config.jwtTokenSecrete);
  } catch (err) {
    return "inValid";
  }
};