var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var notificationAPI = require('../notifications/notifications');


function cancelItemRequest(req, res, next){
  dev_id = mongoose.Types.ObjectId(req.params.id);
  my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

  itemOp.findOne({_id: dev_id}).populate('hasAdministrator','organisation').exec(function (err, device) {
    if (err || device === null) {
        res.json({"error": true, "message": "Processing data failed!"});
    } else {

      var friend_id = device.hasAdministrator[0]._id;

      device.accessRequestFrom = findAndRemove(device.accessRequestFrom, my_id);

      notificationAPI.changeNotificationStatus(my_id, friend_id, 21, {itemId: dev_id});

      device.save();

      res.json({"error": false, "message": device});
    }
  });
}

/*
Private Functions
*/

var findAndRemove = function(array, value){
  for (var i = 0; i < array.length; i++) {
      if (array[i].toString() === value.toString()) {
          array.splice(i, 1);
      }
    }
    return array;
  };

// Export functions
module.exports.cancelItemRequest = cancelItemRequest;
