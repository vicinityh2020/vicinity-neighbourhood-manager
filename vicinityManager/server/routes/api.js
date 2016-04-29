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
    userAccountsOp.find({ 'accountOf.email': userName }, function(error, result) {
      debugger;
      if (error || !result || result.length !== 1){
        response = { success: false };
      } else {
        var accounts = result[0].accountOf;
        // remove unnecessary accounts from results
        for (var index = accounts.length - 1; index >= 0; index --) {
            if (accounts[index].email !== userName){
              accounts.splice(index,1);
            }
        }

        if ((userName === result[0].accountOf[0].email) && (password === result[0].accountOf[0].authentication.password)) {
          var token = jwt.jwtEncode(userName, result[0].accountOf[0].authentication.principalRoles, result[0].id);
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
