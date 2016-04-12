var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;


function getOne(req, res, next) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  itemOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  })
}

function getAll(req, res, next) {
//TODO: User authentic - Role check
  var response = {};

  itemOp.find({}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

module.exports.getOne = getOne;
module.exports.getAll = getAll;
