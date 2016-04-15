var mongoose = require('mongoose');

var gatewayOp = require('../../models/vicinityManager').gateway;

function deleteOne(req, res, next){
  //TODO: User authentic - Role check
      var response = {};
      var o_id = mongoose.Types.ObjectId(req.params.id);
      gatewayOp.remove({ "_id" : o_id}, function(err) {
        res.json({"error" : err});
      });
}

module.exports.deleteOne = deleteOne;
