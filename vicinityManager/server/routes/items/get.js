
// Global objects and variables

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var itemProperties = require("../../helpers/items/additionalItemProperties");

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
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.cid);
  var type = req.query.type;
  var offset = req.query.offset;
  var cid = mongoose.Types.ObjectId(req.query.cid);
  var query;

  userAccountOp.find({_id: o_id}, {knows: 1})
  .then(function(response){

    if(o_id.toString() === cid.toString()){ // Need to compare strings instead of BSON
      query = { typeOfItem: type, hasAdministrator: o_id, status: {$nin: ['disabled', 'deleted']} }; // I am requesting my organisation devices
    } else {
      if(response[0].knows.indexOf(cid) !== -1) {
        query = { typeOfItem: type, hasAdministrator: o_id, accessLevel: { $gt:1 }, status: {$nin: ['disabled', 'deleted']} }; // We are friends I can see more
      } else {
        query = { typeOfItem: type, hasAdministrator: o_id, accessLevel: { $gt:4 }, status: {$nin: ['disabled', 'deleted']} }; // We are not friends I can see less
      }
    }

    itemOp.find(query).populate('hasAdministrator','organisation', 'cid').populate('accessRequestFrom','organisation cid').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
      var dataWithAdditional = itemProperties.getAdditional(data,o_id,[]); // Not necessary to know friends because I am always owner
      if (err) {
        logger.debug('error','Find Items Error: ' + err.message);
        res.json({"error": true, "message": "Error fetching data"});
      } else {
        res.json({"error": false, "message": dataWithAdditional});
      }
    });
  })
  .catch(function(err){res.json({"error": true, "message": err});} );
}

/*
Gets all items that my organisation can see
Receives following parameters:
- Organisation cid
- Type of item of interest: device or service
- Offset: Items are retrieved in groups of XX elements at a time.
*/
function getAllItems(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
  var type = req.body.type;
  var offset = req.body.offset;
  var filterNumber = req.body.filterNumber;
  var filterOntology = typeof req.body.filterOntology !== 'undefined' ? req.body.filterOntology : [];

  userAccountOp.find({_id: o_id}, {knows: 1}, function(err, data){
    if (err){
      logger.debug('error','UserAccount Items Error: ' + err.message);
    }

    var query = {
      typeOfItem: type,
      $or :[
      {$and: [ { hasAdministrator: {$in: data[0].knows}}, { accessLevel: {$in: [2, 3, 4]} } ] },
      { accessLevel: { $gt:4 } },
      { hasAdministrator: o_id }
      ]
    };

    // Filters oids based on ontology matches to the user selection
    if(filterOntology.length > 0){query.oid = {$in: filterOntology}; }

    query = updateQueryWithFilterNumber(query, filterNumber, o_id);

    var friends = data[0].knows;

    itemOp.find(query).populate('hasAdministrator','organisation cid').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
      if (err) {
        logger.debug('error','Find Items Error: ' + err.message);
        response =  {"error": true, "message": "Error fetching data"};
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,o_id,friends);
        response = {"error": false, "message": dataWithAdditional};
      }

      res.json(response);
    });
  });
}

/*
Gets one item based on the OID
Receives following parameters:
- Organisation cid
- Item oid
*/
function getItemWithAdd(req, res, next) {

    // logger.debug('Start: getItemWithAdd');

    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    userAccountOp.find({_id: activeCompany_id}, function (err, data) {
      if(err){
        response = {"error": true, "message": "Processing data failed!"};
        res.json(response);
      } else {
        var friends = data[0].knows;
        itemOp.find({_id: o_id}).populate('hasAdministrator','organisation cid')
            .exec(
              function(err, data){
                if (err || data === null) {
                  response = {"error": true, "message": "Processing data failed!"};
                } else {
                  if (data.length === 1) {
                    var dataWithAdditional = itemProperties.getAdditional(data,activeCompany_id, friends); // Not necessary to know friends because I process only devices underRequest!
                    response = {"error": false, "message": dataWithAdditional};
                  } else {
                    response = {"error": true, "message": "Processing data failed!"};
                  }
                }
                // logger.debug('End: getItemWithAdd');
                res.json(response);
              }
            );
          }
        }
      );
    }

// Private functions

function updateQueryWithFilterNumber(q, fN, cid){
  switch (Number(fN)) {
      case 0:
          q.status = "disabled";
          break;
      case 1:
          q.accessLevel = 1;
          q.status = "enabled";
          break;
      case 2:
          q.accessLevel = {$in: [2, 3, 4]};
          q.hasAdministrator = cid;
          break;
      case 3:
          q.accessLevel = {$in: [5, 6, 7, 8]};
          q.hasAdministrator = cid;
          break;
      case 4:
          q.hasAdministrator = cid;
          break;
      case 5:
          q.accessLevel = {$in: [2, 3, 4]};
          break;
      case 6:
          q.accessLevel = {$in: [5, 6, 7, 8]};
          break;
      case 7:
          break;
        }
        return q;
      }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getMyItems = getMyItems;
module.exports.getItemWithAdd = getItemWithAdd;
