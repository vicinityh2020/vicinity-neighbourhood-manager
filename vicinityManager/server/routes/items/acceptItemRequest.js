var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var sharingRules = require('../../helpers/sharingRules');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;
var notificationAPI = require('../../routes/notifications/notifications');
var audits = require('../../routes/audit/put');

function acceptItemRequest(req, res, next) {
    dev_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

    itemOp.findOne({_id: dev_id}, function (err, device) {
        if (err || device === null) {
          logger.error({user: req.body.userMail, action: 'acceptItemRequest', message: err});
          res.json({"error": true, "message": "Processing data failed!"});
        } else {

          // TODO Change, currently only process the last request
          var friend_id = device.accessRequestFrom[(device.accessRequestFrom.length)-1];
          device.hasAccess.push(friend_id);
          device.accessRequestFrom = findAndRemove(device.accessRequestFrom, friend_id); // Remove my access rqst from the obj

          sharingRules.acceptUserRequest(device.oid, my_id, friend_id);

          var notification = new notificationOp();

          notification.addressedTo.push(friend_id);
          notification.sentBy = my_id;
          notification.type = 24; // itemconnRequest
          notification.status = 'accepted';
          notification.itemId = device._id;
          notification.save();

          audits.putAuditInt(
            my_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              auxConnection: { kind: 'item', item: dev_id },
              user: req.body.userMail,
              triggeredByMe: true,
              eventType: 51 }
          );

          audits.putAuditInt(
            friend_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              user: req.body.userMail,
              auxConnection: { kind: 'item', item: dev_id },
              triggeredByMe: false,
              eventType: 51 }
          );

          audits.putAuditInt(
            dev_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              user: req.body.userMail,
              auxConnection: { kind: 'item', item: dev_id },
              triggeredByMe: false,
              eventType: 51 }
          );

          logger.audit({user: req.body.userMail, action: 'acceptItemRequest', orgOrigin: my_id, orgDest: friend_id, item: dev_id });

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

module.exports.acceptItemRequest = acceptItemRequest;
