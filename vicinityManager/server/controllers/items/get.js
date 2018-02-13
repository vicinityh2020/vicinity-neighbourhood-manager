
// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

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
  var oid = mongoose.Types.ObjectId(req.params.cid);
  var type = req.query.type;
  var offset = req.query.offset;
  var cid = mongoose.Types.ObjectId(req.query.cid);
  sGet.getMyItems(oid, type, offset, cid, function(err, response){
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
  var cid = mongoose.Types.ObjectId(req.query.cid);
  sGet.getItemWithAdd(oid, cid, function(err, response){
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
    var ownerCid = req.body.ownCid;
    var type = req.body.type === undefined ? "all" : req.body.type;

    sGet.getUserItems(reqId, reqCid, ownerCid, type, function(err, response){
      res.json({error: err, message: response});
    });
  }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getMyItems = getMyItems;
module.exports.getItemWithAdd = getItemWithAdd;
module.exports.getUserItems = getUserItems;
