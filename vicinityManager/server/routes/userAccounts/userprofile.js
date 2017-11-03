/**
 * First version by viktor on 31.03.16.
 * Last version Jorge 03.11.17.
 */

var mongoose = require('mongoose');
var userAccountOp = require('../../models/vicinityManager').userAccount;

/*
Get all organisations meeting the  user request (All, friends, no friends)
*/
function getAllFilteredUserAccountsFacade(req, res, next) {

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var type = req.query.type;

  if(Number(type) === 0){
    userAccountOp.find({})
    .then( function(data) { res.json({"error": false, "message": data}); })
    .catch( function(err) { res.json({"error": true, "message": "Error fetching data"}); });
  } else {
    userAccountOp.findById(o_id, {knows: 1})
    .then( function(data){
      var qry;
      if(Number(type) === 1){ qry = {$in: data.knows}; }
      else { qry = {$not: {$in: data.knows}}; }
      return userAccountOp.find({_id: qry});
    })
    .then( function(data){res.json({"error": false, "message": data});})
    .catch( function(err){res.json({"error": true, "message": "Error fetching data"});});
  }
}

/*
Update
*/
function updateUserAccountFacade(req, res, next){
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userAccountOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    });
}

/*
Get one user account -- Checks status against other userAccounts (Friendship)
*/
function getUserAccountFacade(req, res, next) {
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var isNeighbour = false;
    var canSendNeighbourRequest = true;
    var canCancelNeighbourRequest = false;
    var canAnswerNeighbourRequest = false;
    //TODO: Issue #6 Update userAcount profile wheather the autenticated user is friend with :id
    //TODO: Remove foreing users;

      userAccountOp.findById(o_id).populate('knows').populate('accountOf', 'avatar name email occupation location authentication status').exec(function (err, data) {

        if (!data ) {
          res.status(404).send('Not found');
        } else {
          if (err) {
              response = {"error": true, "message": "Error fetching data"};
          } else {
            var numNeighbors = data.knows.length;
              if (req.params.id === req.body.decoded_token.cid){
                  isNeighbour = false;
                  canSendNeighbourRequest = false;
                  canCancelNeighbourRequest = false;
                  canAnswerNeighbourRequest = false;

              } else {
                  // Check wheather we are neihbours
                  for(var index = 0; index < numNeighbors; index++){
                      if (data.knows[index]._id.toString() === req.body.decoded_token.cid) {
                          isNeighbour = true;
                          canSendNeighbourRequest = false;
                      }
                    }

                  //Check whether authenticated user received or sent neighbour request to requested profile
                  //Check whether authenticated user can be canceled sent neighbour request to requested profile
                  for (index in data.knowsRequestsFrom) {
                      if (data.knowsRequestsFrom[index].toString() === req.body.decoded_token.cid) {
                          canSendNeighbourRequest = false;
                          canCancelNeighbourRequest = true;
                      }
                  }
                  //Check whether authenticated user can cancel sent request
                  for (index  in data.knowsRequestsTo) {
                      if (data.knowsRequestsTo[index].toString() === req.body.decoded_token.cid) {
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
            }
      });
}

// Export functions
module.exports.get = getUserAccountFacade;
module.exports.getAllFiltered = getAllFilteredUserAccountsFacade;
module.exports.update = updateUserAccountFacade;
