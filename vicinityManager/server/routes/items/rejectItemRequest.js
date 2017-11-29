var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var itemOp = require('../../models/vicinityManager').item;
var notificationAPI = require('../notifications/notifications');
var notificationOp = require('../../models/vicinityManager').notification;
var audits = require('../../routes/audit/put');

function rejectItemRequest(req, res, next) {
  dev_id = mongoose.Types.ObjectId(req.params.id);
  my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

  itemOp.findOne({_id: dev_id}, function (err, device) {
      if (err || device === null) {
          response = {"error": true, "message": "Processing data failed!"};
      } else {

        // TODO Change, currently only process the last request
        var friend_id = device.accessRequestFrom[device.accessRequestFrom.length-1];
        device.hasAccess = findAndRemove(device.hasAccess, friend_id);
        device.accessRequestFrom = findAndRemove(device.accessRequestFrom, friend_id);

        var notification = new notificationOp();

        notification.addressedTo.push(friend_id);
        notification.sentBy = my_id;
        notification.type = 22;
        notification.status = 'info';
        notification.itemId = device._id;
        notification.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: true,
            eventType: 52 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: false,
            eventType: 52 }
        );

        audits.putAuditInt(
          dev_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: false,
            eventType: 52 }
        );

        notificationAPI.changeNotificationStatus(friend_id, my_id, 21, {itemId: dev_id});

        device.save();

        res.json({"error": false, "message": "Processing data success!"});
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
module.exports.rejectItemRequest = rejectItemRequest;
