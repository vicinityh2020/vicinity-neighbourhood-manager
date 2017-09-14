var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;
var notificationAPI = require('../notifications/notifications');


function cancelItemRequest(req, res, next){
    console.log("Running cancelation of data access request!");
    dev_id = mongoose.Types.ObjectId(req.params.id);
    activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var device = {};
    var response = {};

    itemOp.find({_id: dev_id}).populate('hasAdministrator','organisation').exec(function (err, data) {

        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 1) {

                var device = data[0];


                for (var index = device.accessRequestFrom.length - 1; index >= 0; index --) {
                    if (device.accessRequestFrom[index].toString() === activeCompany_id.toString()) {
                        device.accessRequestFrom.splice(index, 1);
                    }
                }

                notificationAPI.deleteNot(activeCompany_id, device.hasAdministrator[0]._id, 'deviceRequest', 'waiting');

                response = {"error": false, "message": data};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    });
}
module.exports.cancelItemRequest = cancelItemRequest;
