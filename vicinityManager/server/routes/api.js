var express = require('express');
var mongoOp = require('../model/mongo');
var router = express.Router();


/* GET users listing. */
router.post('/authenticate', function(req, res, next) {
  var response = {};
  var userName = req.body.username;
  console.log("username:" + userName);
  var password = req.body.password;
  console.log("password:" + password);
  console.log("!userName: " + !userName);
  console.log("!password: " + !password);
  
  if (userName && password) {
    mongoOp.find({ username: userName }, function(error, result) {
      console.log("result: " + result);
      console.log("restlt.legth: " + result.length);
      console.log("result.username: " + result[0].username);
      console.log("result.password: " + result[0].password);
      console.log("error: " + error);
      if (error || !result || result.length !== 1){
        console.log("!result: " + !result);
        consoel.log("result.length: " + console.log("!userName: " + !userName));
        response = { success: false };
      } else {
        console.log("userName type: " + typeof userName);
        console.log("userName: " + userName);
        console.log("result[0].username type: " + typeof result[0].username);
        console.log("result[0].username: " + result[0].username);
        if (userName === result[0].username) {
          response = { success: true};
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