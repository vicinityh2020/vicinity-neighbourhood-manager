module.exports.getOne = getOne;
module.exports.getAll = getAll;
// module.exports.getAll = getAll;


var mongoose = require('mongoose');
var registrationOp = require('../../models/vicinityManager').registration;
// var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");


function getOne(req, res, next) {
//TODO: User authentic - Role check
  logger.debug('Start getOne');
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  registrationOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    logger.debug('End getOne');
    res.json(response);
  })
}

function getAll(req, res, next) {
//TODO: User authentic - Role check
  var response = {};

  registrationOp.find({}, function(err, data) {
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
