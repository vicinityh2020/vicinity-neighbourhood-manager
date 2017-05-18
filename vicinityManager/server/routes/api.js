var express = require('express');
var mongoose = require('mongoose');
var userAccountsOp = require('../models/vicinityManager').userAccount;
var userOp = require('../models/vicinityManager').user;
var jwt = require('../helpers/jwtHelper');
var moment = require('moment');
var logger = require("../middlewares/logger");
var router = express.Router();


/* GET users listing. */
router.post('/authenticate', function(req, res, next) {

  var response = {};
  var userName = req.body.username;
  var password = req.body.password;

  if (userName && password) {
    userOp.find({ email: userName }, function(error, result) {
      if (error || !result || result.length !== 1){
        res.json({ success: false });
      } else {
        // var accounts = result[0].accountOf;
        // remove unnecessary accounts from results
        // for (var index = accounts.length - 1; index >= 0; index --) {
        //     if (accounts[index].email !== userName){
        //       accounts.splice(index,1);
        //     }
        // }
        if ((userName === result[0].email) && (password === result[0].authentication.password)) {

            var o_id = mongoose.Types.ObjectId(result[0]._id);

            userAccountsOp.find({ accountOf: {$elemMatch: {$eq : o_id }}}, function(error, result2) {
            //TODO: test if exist result2
            var credentials = jwt.jwtEncode(userName, result[0].authentication.principalRoles, result[0]._id, result2[0]._id);

            response = {
              success: true,
              message: credentials
            };
            res.json(response);
          });
        } else {
          res.json({success: false});
        }
      };
    });
  } else {
    res.json({success: false});
  }
});

module.exports = router;
