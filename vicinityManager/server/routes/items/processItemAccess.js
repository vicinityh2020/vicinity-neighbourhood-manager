var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var notificationOp = require('../../models/vicinityManager').notification;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var audits = require('../../routes/audit/put');

function processItemAccess(req, res, next) {

    dev_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);

    itemOp.findOne({_id: dev_id}).populate('hasAdministrator','organisation').exec(function (err, device) {
      if (err || device === null) {
          res.json({"error": true, "message": "Processing data failed!"});
      } else {
          var friend_id = device.hasAdministrator[0]._id;

          device.accessRequestFrom.push(my_id);

          var notification = new notificationOp();

          notification.addressedTo.push(friend_id);      //friend_id     data.hasAdministrator[0]._id
          notification.sentBy = my_id;
          notification.type = 21;
          notification.status = 'waiting';
          notification.itemId = dev_id;
          notification.save();

          audits.putAuditInt(
            my_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              user: req.body.userMail,
              auxConnection: { kind: 'item', item: dev_id },
              triggeredByMe: true,
              eventType: 54 }
          );

          audits.putAuditInt(
            friend_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              user: req.body.userMail,
              auxConnection: { kind: 'item', item: dev_id },
              triggeredByMe: false,
              eventType: 54 }
          );

          audits.putAuditInt(
            dev_id,
            { orgOrigin: my_id,
              orgDest: friend_id,
              user: req.body.userMail,
              auxConnection: { kind: 'item', item: dev_id },
              triggeredByMe: false,
              eventType: 54 }
          );

          device.save();

          res.json({"error": false, "message": device});
      }
    });
  }

module.exports.processItemAccess = processItemAccess;
