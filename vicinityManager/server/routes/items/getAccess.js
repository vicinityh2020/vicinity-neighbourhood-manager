var mongoose = require('mongoose');

var itemOp = require('../../models/vicinityManager').item;

function getAccess(req, res, next){
    console.log("Getting back access (renewing of access data)!");
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

                // device.hasAccess[device.hasAccess.length]=activeCompany_id;              nefunguje, treba pouzit push()
                device.hasAccess.push(activeCompany_id);

                device.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }

        res.json(response);
    });
}
module.exports.getAccess = getAccess;
