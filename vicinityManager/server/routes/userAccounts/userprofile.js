/**
 * Created by viktor on 31.03.16.
 */

 // TODO Rework whole module!!

var mongoose = require('mongoose');
var ce = require('cloneextend');
var userAccountOp = require('../../models/vicinityManager').userAccount;
var userOp = require('../../models/vicinityManager').user;

/*
Get all organisations meeting the  user request (All, friends, no friends)
*/
function getAllFilteredUserAccountsFacade(req, res, next) {

  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var type = req.query.type;

  if(Number(type) === 0){
    userAccountOp.find({},
      function(err, data) {
        if (err) {
          res.json({"error": true, "message": "Error fetching data"});
        } else {
          res.json({"error": false, "message": data});
        }
      }
    );
  } else {
    userAccountOp.findById(o_id, {knows: 1},
      function(err, data){
        if (err) {
          res.json({"error": true, "message": "Error fetching data"});
        } else {
          var qry;
          if(Number(type) === 1){
            qry = {$in: data.knows};
          } else {
            qry = {$not: {$in: data.knows}};
          }
          userAccountOp.find({_id: qry},
            function(err, data) {
              if (err) {
                res.json({"error": true, "message": "Error fetching data"});
              } else {
                res.json({"error": false, "message": data});
              }
            }
          );
        }
      }
    );
  }
}

/*
Other
*/

function createUserAccountFacade(req, res, next) {

  var db = new userAccountOp();
  var response = {};

  db.organisation =  req.body.organisation;
  db.avatar = req.body.avatar;
  db.creatorOf = ce.clone(req.body.creatorOf);//Users that are creator UserAccount
  db.follows = ce.clone(req.body.follows); //Follows UserAccounts
  db.memberOf = ce.clone(req.body.memberOf); //Member of UserGroups
  // db.location = req.body.location;
  db.accountOf = ce.clone(req.body.accountOf);
  db.knows = ce.clone(req.body.knows);
  db.knowsRequestsFrom = ce.clone(req.body.knowsRequestsFrom);
  db.knowsRequestsTo = ce.clone(req.body.knowsRequestsTo);
  db.hasNotifications = ce.clone(req.body.hasNotifications);
  db.modifierOf = ce.clone(req.body.modifierOf);
  db.administratorOf = ce.clone(req.body.administratorOf);
  db.badges = ce.clone(req.body.badges);
  db.notes = req.body.notes;

  db.save(function(err) {
    if (err) {
      response = {"error": true, "message": "Error adding data!"};
    } else {
      response = {"error": false, "message": "Data added!"};
    }
    res.json(response);
  });
}

function deleteUserAccountFacade(req, res, next) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  userAccountOp.remove({ "_id" : o_id}, function(err) {
    res.json({"error" : err});
  });
}

function updateUserAccountFacade(req, res, next){
    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var updates = req.body;
    userAccountOp.update({ "_id": o_id}, updates, function(err, raw){
      response = {"error": err, "message": raw};
      res.json(response);
    });
}

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
module.exports.delete = deleteUserAccountFacade;
module.exports.create = createUserAccountFacade;
