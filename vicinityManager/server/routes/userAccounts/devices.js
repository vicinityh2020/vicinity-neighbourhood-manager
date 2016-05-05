var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;

function getMyDevices(req, res, next) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

  itemOp.find({hasAdministrator: { $in: [o_id]}}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });

}

function getNeighbourhood(req, res, next) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

  userAccountOp.find({_id: o_id}, function(err, data){
    if (data && data.length == 1){
      itemOp.find({hasAdministrator: { $in: data[0].knows }}, function(err, data) {
        if (err) {
          response = {"error": true, "message": "Error fetching data"};
        } else {
          response = {"error": false, "message": data};
        }
        res.json(response);
      });
    }
  });

}


module.exports.getMyDevices = getMyDevices;
module.exports.getNeighbourhood = getNeighbourhood;
