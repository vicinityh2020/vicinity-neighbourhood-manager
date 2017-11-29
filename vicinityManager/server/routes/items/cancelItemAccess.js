var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var sharingRules = require('../../helpers/sharingRules');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;
var audits = require('../../routes/audit/put');

function cancelItemAccess(req, res, next){

  dev_id = mongoose.Types.ObjectId(req.params.id);
  my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
  var device = {};
  var response = {};

  itemOp.findOne({_id: dev_id}, function (err, device) {

      if (err || device === null) {
          res.json({"error": true, "message": "Processing data failed!"});
      } else {

        device.hasAccess = findAndRemove(device.hasAccess, my_id); // Remove my access from the obj

        sharingRules.cancelItemAccess(device.oid, device.hasAdministrator[0], my_id);

        var friend_id = device.hasAdministrator[0]._id;

        var notification = new notificationOp();

        notification.addressedTo.push(my_id);
        notification.sentBy = my_id;
        notification.type = 23;
        notification.status = 'info';
        notification.itemId = dev_id;
        notification.isUnread = true;
        notification.save();

        audits.putAuditInt(
          my_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: true,
            eventType: 53 }
        );

        audits.putAuditInt(
          friend_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: false,
            eventType: 53 }
        );

        audits.putAuditInt(
          dev_id,
          { orgOrigin: my_id,
            orgDest: friend_id,
            user: req.body.userMail,
            auxConnection: { kind: 'item', item: dev_id },
            triggeredByMe: false,
            eventType: 53 }
        );

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
module.exports.cancelItemAccess = cancelItemAccess;
