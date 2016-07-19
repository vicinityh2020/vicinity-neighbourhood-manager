module.exports.getOne = getOne;
module.exports.getAll = getAll;
// module.exports.getAll = getAll;


var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
// var userAccountOp = require('../../models/vicinityManager').userAccount;
var winston = require('winston');

winston.level='debug';

function getOne(req, res, next) {
//TODO: User authentic - Role check
  winston.log('debug','Start getOne');
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  userOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    winston.log('debug','End getOne');
    res.json(response);
  })
}

function getAll(req, res, next) {
//TODO: User authentic - Role check
  var response = {};

  userOp.find({}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

// function getAll(req, res, next) {
// //TODO: User authentic - Role check
//   var response = {};
//
//   itemOp.find({}, function(err, data) {
//     if (err) {
//       response = {"error": true, "message": "Error fetching data"};
//     } else {
//       response = {"error": false, "message": data};
//     }
//     res.json(response);
//   });
// }
