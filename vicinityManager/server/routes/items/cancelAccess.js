var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var itemOp = require('../../models/vicinityManager').item;

function cancelAccess(req, res, next){
    console.log("Running cancelation of data access (interruption of data access)!");
    dev_id = mongoose.Types.ObjectId(req.params.id);
    activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var device = {};
    var response = {};

    itemOp.find({_id: dev_id}, function (err, data) {

        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 1) {

                var device = data[0];

                for (var index = device.hasAccess.length - 1; index >= 0; index --) {
                  if(device.hasAccess[index] && activeCompany_id){
                    if (device.hasAccess[index].toString() === activeCompany_id.toString()) {
                        device.hasAccess.splice(index, 1);
                    }
                  }
                }

                commServer.callCommServer({}, 'users/' + dev_id + '/groups/' + activeCompany_id + '_foreignDevices', 'DELETE');
                device.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    });
}
module.exports.cancelAccess = cancelAccess;
