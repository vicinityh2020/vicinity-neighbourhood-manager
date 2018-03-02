var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sGet = require("../../services/organisations/get");

/*
Get all organisations meeting the  user request (All, friends, no friends)
*/
function getAll(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = req.query.type; // 0 all, 1 friends, else not friends
  sGet.getAll(cid, Number(type), function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Get one user account -- Checks status against other userAccounts (Friendship)
*/
function getOne(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.params.id);
  var mycid = req.body.decoded_token.orgid;
  sGet.getOne(cid, mycid, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Get CID
*/
// TODO remove, obsolete, replace once web app ready for the change
function getCid(req, res, next){
  var cid = mongoose.Types.ObjectId(req.params.id);
  sGet.getCid(cid, function(err, response){
    res.json({error: err, message: response});
  });
}

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getCid = getCid;
