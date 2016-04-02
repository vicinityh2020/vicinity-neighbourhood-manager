/**
 * Created by viktor on 31.03.16.
 */
var mongoose = require('mongoose');

var userAccountOp = require('../../models/vicinityManager').userAccount;

function getProfileFacade(req, res, next) {

    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var isNeighbour = false;
    var canSendNeighbourRequest = true;
    var canCancelNeighbourRequest = false;
    var canAnswerNeighbourRequest = false;
    //TODO: Issue #6 Update userAcount profile wheather the autenticated user is friend with :id

    userAccountOp.findById(o_id).populate('knows').exec(function (err, data) {
        if (err) {
            response = {"error": true, "message": "Error fetching data"};
        } else {

            if (req.params.id === req.body.decoded_token.context.id){
                isNeighbour = false;
                canSendNeighbourRequest = false;
                canCancelNeighbourRequest = false;
                canAnswerNeighbourRequest = false;
                
            } else {
                //Check wheather we are neihbours
                for (index in data.knows) {
                    if (data.knows[index].email === req.body.decoded_token.sub) {
                        isNeighbour = true;
                        canSendNeighbourRequest = false;
                    }
                }

                //Check whether authenticated user received or sent neighbour request to requested profile
                //Check whether authenticated user can be canceled sent neighbour request to requested profile

                for (index in data.knowsRequestsFrom) {
                    if (data.knowsRequestsFrom[index].toString() === req.body.decoded_token.context.id) {
                        canSendNeighbourRequest = false;
                        canCancelNeighbourRequest = true;
                    }

                }

                //Check whether authenticated user can cancel sent request
                for (index  in data.knowsRequestsTo) {
                    if (data.knowsRequestsTo[index].toString() === req.body.decoded_token.context.id) {
                        canSendNeighbourRequest = false;
                        canAnswerNeighbourRequest = true;
                    }
                }

            }
            //TODO: Issue #6 Check existing knows requests


            plain_data = data.toObject();
            plain_data.isNeighbour = isNeighbour;
            plain_data.canSendNeighbourRequest = canSendNeighbourRequest;
            plain_data.canCancelNeighbourRequest = canCancelNeighbourRequest;
            plain_data.canAnswerNeighbourRequest = canAnswerNeighbourRequest;
            response = {"error": false, "message": plain_data};
        }
        res.json(response);
    })
}

module.exports.get = getProfileFacade;