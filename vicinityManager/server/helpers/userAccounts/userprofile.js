/**
 * Created by viktor on 31.03.16.
 */
var mongoose = require('mongoose');

var userAccountOp = require('../../models/vicinityManager').userAccount;

function getProfile(req, res, next) {
    debugger;
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var isNeighbour = false;
    var isNeighbourRequestAllowed = true;
    //TODO: Issue #6 Update userAcount profile wheather the autenticated user is friend with :id

    userAccountOp.findById(o_id).populate('knows').exec(function (err, data) {
        if (err) {
            response = {"error": true, "message": "Error fetching data"};
        } else {
            response = {"error": false, "message": data};
        }
        for (index in response.message.knows) {
            if (response.message.knows[index].email === req.body.decoded_token.sub) {
                isNeighbour = true;
                isNeighbourRequestAllowed = false;
            }
        }
        debugger;
        for (index in response.message.knowsRequestsFrom) {
            if (response.message.knowsRequestsFrom[index].toString() === req.body.decoded_token.context.id) {
                isNeighbourRequestAllowed = false;
            }
        }
        //TODO: Issue #6 Check existing knows requests
        response.message.isNeighbour = isNeighbour;
        response.message.isNeighbourRequestAllowed = isNeighbourRequestAllowed;
        res.json(response);
    })


}

module.exports.get = getProfile;