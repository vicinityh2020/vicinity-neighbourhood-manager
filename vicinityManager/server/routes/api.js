var express = require('express');
var userAccountsOp = require('../models/vicinityManager').userAccount;
var jwt = require('../helpers/jwtHelper');
var moment = require('moment');
var router = express.Router();


/* GET users listing. */
router.post('/authenticate', function(req, res, next) {
  debugger;
  var response = {};
  var userName = req.body.username;
  var password = req.body.password;
  
  if (userName && password) {
    userAccountsOp.find({ email: userName }, function(error, result) {
      debugger;
      if (error || !result || result.length !== 1){
        response = { success: false };
      } else {
        if ((userName === result[0].email) && (password === result[0].authentication.password)) {
          var token = jwt.jwtEncode(userName, result[0].authentication.principalRoles);
          response = { 
            success: true, 
            message: token}
        } else {
          response = { success: false};
        }
      };
      res.json(response);
    });
  } else {
    res.json({success: false});
  }
});

module.exports = router;