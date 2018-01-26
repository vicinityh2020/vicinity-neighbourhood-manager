
// Global objects and variables

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
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

  userAccountOp.findOne(o_id, {knows: 1})
  .then(function(response){
    var parsedData = response.toObject();
    var friends = [];
    if(parsedData.knows != null){
        getIds(parsedData.knows, friends);
    }
    if(o_id.toString() === cid.toString()){ // Need to compare strings instead of BSON
      query = { typeOfItem: type, 'cid.id': o_id, status: {$nin: ['disabled', 'deleted']} }; // I am requesting my organisation devices
    } else {
      if(friends.indexOf(cid) !== -1) {
        query = { typeOfItem: type, 'cid.id': o_id, accessLevel: { $gte:0 }, status: {$nin: ['disabled', 'deleted']} }; // We are friends I can see more
      } else {
        query = { typeOfItem: type, 'cid.id': o_id, accessLevel: { $gte:1 }, status: {$nin: ['disabled', 'deleted']} }; // We are not friends I can see less
      }
    }
    itemOp.find(query).populate('cid.id','name cid').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
      var dataWithAdditional = itemProperties.getAdditional(data,o_id,friends); // Not necessary to know friends because I am always owner
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
  var o_id = mongoose.Types.ObjectId(req.params.cid);
  // var o_id = req.params.cid;
  var type = req.body.type;
  var offset = req.body.offset;
  var filterNumber = req.body.filterNumber;
  var filterOntology = typeof req.body.filterOntology !== 'undefined' ? req.body.filterOntology : [];

  userAccountOp.findOne(o_id, {knows: 1}, function(err, data){
    if (err){
      logger.debug('error','UserAccount Items Error: ' + err.message);
    }
    var parsedData = data.toObject();

    var friends = [];
    var query = {
      typeOfItem: type,
      $or :[ { accessLevel: 2 }, { 'cid.id': o_id }]
    };
    if(parsedData.knows != null){
        getIds(parsedData.knows, friends);
        query = {
          typeOfItem: type,
          $or :[
          { $and: [ { 'cid.id': {$in: friends}}, { accessLevel: 1 } ] },
          { accessLevel: 2 },
          { 'cid.id': o_id }
          ]
        };
      }

    // Filters oids based on ontology matches to the user selection
    if(filterOntology.length > 0){query.oid = {$in: filterOntology}; }

    query = updateQueryWithFilterNumber(query, filterNumber, o_id);

    itemOp.find(query).populate('cid.id','name cid').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
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

    var o_id = mongoose.Types.ObjectId(req.params.id);
    var activeCompany_id = mongoose.Types.ObjectId(req.query.cid);
    userAccountOp.findOne(activeCompany_id, {knows:1}, function (err, data) {
      var parsedData = data.toObject();
      if(err){
        res.json({"error": true, "message": "Processing data failed!"});
      } else {
        var friends = [];
        if(parsedData.knows != null){
            getIds(parsedData.knows, friends);
        }

        itemOp.find({_id: o_id}).populate('cid.id','name cid')
            .exec(
              function(err, data){
                if (err || data === null) {
                  res.json({"error": true, "message": "Processing data failed!"});
                } else {
                  var dataWithAdditional = itemProperties.getAdditional(data, activeCompany_id, friends); // Not necessary to know friends because I process only devices underRequest!
                  res.json({"error": false, "message": dataWithAdditional});
                }
              }
            );
          }
        }
      );
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
    var type = req.body.type;
    var data = {};
    var parsedData = {};
    var items = [];
    var friends = [];

    userOp.findOne({_id: reqId}, {hasItems: 1, cid: 1}).populate('hasItems.id','name accessLevel typeOfItem cid avatar')
    .then(function(response){
      parsedData = response.toObject();
      items = parsedData.hasItems;
      data.cid = parsedData.cid;
      data._id = parsedData._id;
      return userAccountOp.findOne({_id:reqCid}, {knows:1});
    })
    .then(function(response){
      parsedFriends = response.toObject();
      getIds(parsedFriends.knows, friends);
      var relation = myRelationWithOther(ownerCid, reqCid, friends);

      if(relation === 1){
        items = items.filter(function(i){return i.id.accessLevel >= 1 && i.id.typeOfItem === type;});
      } else if(relation === 2){
        items = items.filter(function(i){return i.id.accessLevel === 2 && i.id.typeOfItem === type;});
      } else {
        items = items.filter(function(i){return i.id.typeOfItem === type;});
      }

      data.items = items;

      res.json({"error": false, "message": data});
    })
    .catch(function(error){
      logger.debug(error);
      res.json({"error": true, "message": error});
    });

  }

// Private functions

function updateQueryWithFilterNumber(q, fN, cid){
  switch (Number(fN)) {
      case 0:
          q.status = "disabled";
          break;
      case 1:
          q.accessLevel = 0;
          q.status = "enabled";
          break;
      case 2:
          q.accessLevel = 1;
          q['cid.id'] = cid;
          break;
      case 3:
          q.accessLevel = 2;
          q['cid.id'] = cid;
          break;
      case 4:
          q['cid.id'] = cid;
          break;
      case 5:
          q.accessLevel = 1;
          break;
      case 6:
          q.accessLevel = 2;
          break;
      case 7:
          break;
        }
        return q;
      }

  function myRelationWithOther(a,b,c){
    // toString array items
    c = c.join();
    c = c.split(',');
    // find relation
    if(a.toString() === b.toString()){ return 0; } // Same company
    else if(c.indexOf(a.toString()) !== -1){ return 1; } // Friend company
    else { return 2; } // Other company
  }

  function getIds(array, friends){
    for(var i = 0; i < array.length; i++){
      friends.push(array[i].id);
    }
  }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getMyItems = getMyItems;
module.exports.getItemWithAdd = getItemWithAdd;
module.exports.getUserItems = getUserItems;
