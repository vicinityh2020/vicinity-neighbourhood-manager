var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sGet = require("../../services/organisations/get");

/*
Get all organisations meeting the  user request (All, friends, no friends)
*/
function getAll(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.params.id);
  var api = false;
  // var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = req.query.type; // 0 all, 1 friends, else not friends
  var offset = req.query.offset; // 0 all, 1 friends, else not friends
  var limit = 12;
  sGet.getAll(cid, Number(type), offset, limit, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
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
    if(err) logger.log(req, res, {type: 'error', data: response});
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
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

// Export functions

module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getCid = getCid;
