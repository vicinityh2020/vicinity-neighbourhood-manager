var jwt = require('jwt-simple');
var config = require('../configuration/configuration');
var moment = require('moment');

module.exports.jwtEncode = function(userAccountId, email, roles, companyAccountId, cid){

    var key = config.jwtTokenSecret;
    var expires = moment().add(7, 'days').valueOf();
    var token = jwt.encode({
        iss: 'vicinityManager',
        sub: email,
        exp: expires,
        roles: roles,
        uid: userAccountId,
        orgid: companyAccountId,
        cid: cid
    }, config.jwtTokenSecret);
    var response = {token: token};
    return response;
  };

module.exports.jwtDecode = function(token) {
  try {
    return jwt.decode(token, config.jwtTokenSecret);
  } catch (err) {
    return "inValid";
  }
};
