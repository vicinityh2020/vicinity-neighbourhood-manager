var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;


function putOne(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var updates = req.body;
  itemOp.update({ "_id": o_id}, updates, function(err, raw){
    response = {"error": err, "message": raw};
    res.json(response);
  })
}

function delIdFromHasAccessAndAccessRequestFrom(adminId, friendId){

    itemOp.find({ hasAdministrator: {$in : [adminId]}, accessRequestFrom: {$in : [friendId]}},function(err, data){
        var dev = {};
        for (index in data){
          dev = data[index];

          for (var index2 = dev.accessRequestFrom.length - 1; index >= 0; index --) {
              if (dev.accessRequestFrom[index2].toString() === friendId.toString()) {
                  dev.accessRequestFrom.splice(index2, 1);
              }
          };

          dev.save();
        };
    });

    itemOp.find({ hasAdministrator: {$in : [adminId]}, hasAccess: {$in : [friendId]}},function(err, data){
        var dev = {};
        for (index in data){
          dev = data[index];

          for (var index2 = dev.hasAccess.length - 1; index >= 0; index --) {
              if (dev.hasAccess[index2].toString() === friendId.toString()) {
                  dev.hasAccess.splice(index2, 1);
              }
          };

          dev.save();
        };
    });

}

module.exports.putOne = putOne;
module.exports.delIdFromHasAccessAndAccessRequestFrom = delIdFromHasAccessAndAccessRequestFrom;
