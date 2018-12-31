var mongoose = require('mongoose');
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

// Functions

/*
Get all organisations meeting the  user request (All, friends, no friends)
*/
function getAll(cid, type, offset, limit, api, callback) {
  var projection = {};
  var qry = {};
  if(api){
    projection = "name cid";
  } else {
    projection = "-status -hasAudits -hasNotifications";
  }
  if(type === 0){
    qry = {status: { $not: /^del.*/} };
    userAccountOp.find(qry).select(projection).skip(Number(offset)).limit(Number(limit)) // if the field status exists, is also equal to deleted
    .then( function(data) { callback(false, data); })
    .catch( function(err) { callback(true, err); });
  } else {
    userAccountOp.findById(cid, {knows: 1})
    .then( function(data){
      var parsedData = data.toObject();
      var friends = [];
      if(parsedData){
        getIds(parsedData.knows, friends);
      }
      if(type === 1){ qry = {_id: {$in: friends}, status: { $not: /^del.*/}}; }
      else { qry = {_id: {$not: {$in: friends} }, status: { $not: /^del.*/}}; }
      return userAccountOp.find(qry).select(projection).skip(Number(offset)).limit(Number(limit)); // if the field status exists, is also equal to deleted
    })
    .then( function(data){callback(false, data); })
    .catch( function(err){callback(true, err); });
  }
}

/*
Get one user account -- Checks status against other userAccounts (Friendship)
*/
function getOne(cid, mycid, callback) {
  var isNeighbour = false;
  var canSendNeighbourRequest = true;
  var canCancelNeighbourRequest = false;
  var canAnswerNeighbourRequest = false;

  userAccountOp.findById(cid).populate('knows.id').populate('accountOf.id', 'avatar name email occupation location status accessLevel').exec(function (err, data) {

    if (!data ) {
      callback(true, "Company ID not found");
    } else {
      if (err) {
          callback(true, err);
      } else {
        var parsedData = data.toObject();
        var myNeighbors = parsedData.knows;
        var requestsFrom = parsedData.knowsRequestsFrom;
        var requestTo = parsedData.knowsRequestsTo;

          if (cid.toString() === mycid){
              isNeighbour = false;
              canSendNeighbourRequest = false;
              canCancelNeighbourRequest = false;
              canAnswerNeighbourRequest = false;

          } else {
              // Check wheather we are neihbours
            for(var index = 0; index < myNeighbors.length; index++){
                if (myNeighbors[index].id._id.toString() === mycid) {
                    isNeighbour = true;
                    canSendNeighbourRequest = false;
                }
              }
            //Check whether authenticated user received or sent neighbour request to requested profile
            //Check whether authenticated user can be canceled sent neighbour request to requested profile
              for (index = 0; index < requestsFrom.length; index++) {
                if (requestsFrom[index].id.toString() === mycid) {
                  canSendNeighbourRequest = false;
                  canCancelNeighbourRequest = true;
                }
              }

            //Check whether authenticated user can cancel sent request
              for (index = 0; index < requestTo.length; index++) {
                if (requestTo[index].id.toString() === mycid) {
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
          callback(false, plain_data);
          }
        }
  });
}

/*
Get CID
*/
function getCid(cid, callback){
  userAccountOp.findById(cid, {cid: 1, name: 1}, function (err, data) {
    if(err){ callback(true, err); } else { callback(false, data); }
  });
}

// Private functions

function getIds(array, friends){
  for(var i = 0; i < array.length; i++){
    friends.push(array[i].id);
  }
}

// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getCid = getCid;
