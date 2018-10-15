
// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sGet = require('../../services/items/get');

/* Public functions
This module supports item data retrieval.
*/

/*
Gets all items belonging to my organisation
Receives following parameters:
- Organisation cid
- Type of item of interest: device or service
- Offset: Items are retrieved in groups of XX elements at a time.
*/
function getMyItems(req, res) {
  req.query.limit = 12; // Default valur for the webApp
  var api = false; // Call origin api or webApp
  sGet.getOrgItems(req, res, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Gets all items that I can share with other organisation:
- Organisation cid (foreign org)
- Item Id of the item I am requesting
*/
function getMyContractItems(req, res) {
  var api = false; // Call origin api or webApp
  sGet.getMyContractItems(req, res, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Gets array of items:
- array of items
*/
function getArrayOfItems(req, res) {
  var items = req.body;
  var myuid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var api = false; // Call origin api or webApp
  sGet.getArrayOfItems(items, mycid, myuid, api, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Gets all items that my organisation can see
Receives following parameters:
- Organisation cid
- Type of item of interest: device or service
- Offset: Items are retrieved in groups of XX elements at a time.
*/
function getAllItems(req, res) {
  var oid = mongoose.Types.ObjectId(req.params.cid);
  var type = req.body.type;
  var offset = req.body.offset;
  var filterNumber = req.body.filterNumber;
  var filterOntology = typeof req.body.filterOntology !== 'undefined' ? req.body.filterOntology : [];
  sGet.getAllItems(oid, type, offset, filterNumber, filterOntology, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

/*
Gets one item based on the OID
Receives following parameters:
- Organisation cid
- Item oid
*/
function getItemWithAdd(req, res, next) {
  var oid = mongoose.Types.ObjectId(req.params.id);
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  sGet.getItemWithAdd(oid, cid, function(err, response){
    if(err) logger.log(req, res, {type: 'error', data: response});
    res.json({error: err, message: response});
  });
}

  /*
  Gets user items
  Only those which can be shared depending on the situation:
  - Request service -- Depends on service owner
  */

  function getUserItems(req, res, next){
    var reqId = mongoose.Types.ObjectId(req.body.reqId);
    var reqCid = mongoose.Types.ObjectId(req.body.reqCid);
    var myCid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var type = (req.body.type === 'undefined' || (req.body.type !== "device" && req.body.type !== "service")) ? "all" : req.body.type;
    sGet.getUserItems(reqId, reqCid, myCid, type, function(err, response){
      if(err) logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
    });
  }

  /*
  Gets items count
  Query input organisation or user. If undefined --> organisation.
  Returns: Items in organisation or for my user.
  Divided in services and devices
  */

  function getCount(req, res, next){
    var myId = mongoose.Types.ObjectId(req.body.decoded_token.uid);
    var myCid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var onlyUser = req.params.type === 'user' ? true : false;
    sGet.getCount(myId, myCid, onlyUser, function(err, response){
      if(err) logger.log(req, res, {type: 'error', data: response});
      res.json({error: err, message: response});
    });
  }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getMyItems = getMyItems;
module.exports.getArrayOfItems = getArrayOfItems;
module.exports.getItemWithAdd = getItemWithAdd;
module.exports.getUserItems = getUserItems;
module.exports.getMyContractItems = getMyContractItems;
module.exports.getCount = getCount;
