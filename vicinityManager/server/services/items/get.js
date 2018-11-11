
// Global objects and variables

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logBuilder");
var itemProperties = require("../../services/items/additionalItemProperties");
var commServer = require('../../services/commServer/request');

/*
Public functions
*/

/*
Gets all items belonging to my organisation
Receives following parameters:
- Organisation cid
- Type of item of interest: device or service
- Offset: Items are retrieved in groups of XX elements at a time.
*/
function getOrgItems(req, res, api, callback) {
  var cid = mongoose.Types.ObjectId(req.params.cid);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var limit = typeof req.query.limit === 'undefined' ? 25 : req.query.limit;
  limit = limit > 25 ? 25 : limit; // Max limit
  var offset = typeof req.query.offset === 'undefined' ? 0 : req.query.offset;
  var type = (req.query.type !== "device" && req.query.type !== "service") ? "all" : req.query.type;
  var query;
  var projection;

  userAccountOp.findOne(cid, {knows: 1})
  .then(function(response){
    var parsedData = response.toObject();
    var friends = [];
    if(parsedData.knows != null){
        getIds(parsedData.knows, friends);
    }

    if(cid.toString() === mycid.toString()){ // Need to compare strings instead of BSON
      query = {'cid.id': cid, status: {$nin: ['disabled', 'deleted']} }; // I am requesting my organisation devices
    } else {
      if(friends.indexOf(mycid.toString()) !== -1) {
        query = {'cid.id': cid, accessLevel: { $gt:0 }, status: {$nin: ['disabled', 'deleted']} }; // We are friends I can see more
      } else {
        query = {'cid.id': cid, accessLevel: { $gt:1 }, status: {$nin: ['disabled', 'deleted']} }; // We are not friends I can see less
      }
    }

    if( type !== "all" ){ query.typeOfItem = type; }

    if(api){
      projection = { status: 0, avatar: 0, hasContracts: 0, hasAudits: 0 };
    } else {
      projection = { status: 0 };
    }

    itemOp.find(query).select(projection).populate('cid.id','name cid').sort({name:1}).skip(Number(offset)).limit(limit).exec(function(err, data){
      if (err) {
        callback(true, data);
      } else {
        if(api){
          callback(false, data);
        } else {
          var dataWithAdditional = itemProperties.getAdditional(data, cid, friends); // Not necessary to know friends because I process only devices underRequest!
          if(dataWithAdditional.error){
            callback(true, dataWithAdditional.message);
          } else {
            callback(false, dataWithAdditional.items);
          }
        }
      }
    });
  })
  .catch(function(err){callback(true, err);} );
}

/*
Gets all items that I can share with other organisation:
- Organisation cid (foreign org)
- Item Id of the item I am requesting
*/
function getMyContractItems(req, res, api, callback) {
  var cid = mongoose.Types.ObjectId(req.params.cid);
  var oid = mongoose.Types.ObjectId(req.params.oid);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var query;
  var projection;

  userAccountOp.findOne(cid, {knows: 1})
  .then(function(response){
    var friends = [];
    if(typeof response.knows !== 'undefined'){
        getIds(response.knows, friends);
    }

    if(cid.toString() === mycid.toString()){ // Need to compare strings instead of BSON
      if(api){
        logger.log(req, res, {type: 'warn', data: 'You cannot request a contract with your own devices, choose a service from a different organisation'});
        callback(false, 'You cannot request a contract with your own devices, choose a service from a different organisation');
      } else {
        query = {'cid.id': mycid, status: {$nin: ['disabled', 'deleted']} }; // I am requesting my organisation devices
      }
    } else {
      if(friends.indexOf(mycid.toString()) !== -1) {
        query = {'cid.id': mycid, accessLevel: { $gt:0 }, status: {$nin: ['disabled', 'deleted']} }; // We are friends I can see more
      } else {
        query = {'cid.id': mycid, accessLevel: { $gt:1 }, status: {$nin: ['disabled', 'deleted']} }; // We are not friends I can see less
      }
    }

    if(api){
      projection = { status: 0, avatar: 0, hasContracts: 0, hasAudits: 0 };
    } else {
      projection = { status: 0, avatar: 0, hasAudits: 0 };
    }

    itemOp.find(query).select(projection).populate('cid.id', 'name').exec(function(err, data){
      if (err) {
        callback(true, err);
      } else {
        callback(false, data);
      }
    });
  })
  .catch(function(err){callback(true, err);} );
}

/**
* Get the items that are sharing data with a certain service
*/
function getItemsContracted(req, res, api, callback) {
  var oid = req.params.oid;
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var oids = [];
  itemOp.count({oid: oid, 'cid.id': mycid})
  .then(function(response){
    if(response === 0 ){
      logger.log(req, res, {type: 'warn', data: 'The service is not yours'});
      callback(true, 'The service is not yours');
    }
    return commServer.callCommServer({}, 'users/' + oid + '/roster', 'GET');
  })
  .then(function(response){
    var data = JSON.parse(response);
    for( var i = 0, l = data.rosterItem.length; i < l; i++){
      var aux = data.rosterItem[i].jid;
      var n = aux.indexOf("@");
      oids.push(aux.substring(0, n));
    }
    return itemOp.find({oid: {$in: oids}, 'cid.id': {$ne: mycid} }, {info: 1});
  })
  .then(function(response){
    if(!response){
      logger.log(req, res, {type: 'warn', data: 'No items found'});
      response = "No items found";
    }
    callback(false, response);
  })
  .catch(function(err){
    callback(true, err);
  });
}

/*
Gets array of items:
- array of items
*/
function getArrayOfItems(items, token_cid, token_uid, api, callback) {
  var projection = {name:1, oid:1, adid:1, cid:1, uid:1, interactionPatterns:1, accessLevel:1, typeOfItem:1, hasContracts:1 };
  itemOp.find({'_id': { $in: items } }, projection)
  .then(function(response){
    for(var i = 0; i < response.length; i++){
      response[i]._doc.isMine = response[i].uid.id.toString() === token_uid.toString();
    }
    callback(false, response);
  })
  .catch(function(err){
    callback(true, err);
  });
}

/*
Gets all items that my organisation can see
Receives following parameters:
- Organisation cid
- Type of item of interest: device or service
- Offset: Items are retrieved in groups of XX elements at a time.
*/
function getAllItems(cid, type, offset, filterNumber, filterOntology, callback) {

  userAccountOp.findOne(cid, {knows: 1}, function(err, data){
    if (err){
      callback(true, err);
    }
    var parsedData = data.toObject();

    var friends = [];
    var query = {
      typeOfItem: type,
      $or :[ { accessLevel: 2 }, { 'cid.id': cid }]
    };
    if(parsedData.knows != null){
        getIds(parsedData.knows, friends);
        query = {
          typeOfItem: type,
          $or :[
          { $and: [ { 'cid.id': {$in: friends}}, { accessLevel: 1 } ] },
          { accessLevel: 2 },
          { 'cid.id': cid }
          ]
        };
      }

    // Filters oids based on ontology matches to the user selection
    if(filterOntology.length > 1){ query["info.type"] = {$in: filterOntology}; }
    query = updateQueryWithFilterNumber(query, filterNumber, cid);

    itemOp.find(query).populate('cid.id','name cid').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
      if (err) {
        callback(true, err);
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data, cid, friends); // Not necessary to know friends because I process only devices underRequest!
        if(dataWithAdditional.error){
          callback(true, dataWithAdditional.message);
        } else {
          callback(false, dataWithAdditional.items);
        }
      }
    });
  });
}

/*
Gets one item based on the OID
Receives following parameters:
- Organisation cid
- Item oid
*/
function getItemWithAdd(oid, cid, callback) {
    userAccountOp.findOne(cid, {knows:1}, function (err, data) {
      var parsedData = data.toObject();
      if(err){
        callback(true, err);
      } else {
        var friends = [];
        if(parsedData.knows != null){
            getIds(parsedData.knows, friends);
        }

        itemOp.find({_id: oid}).populate('cid.id','name cid')
            .exec(
              function(err, data){
                if (err || data === null) {
                  callback(true, err);
                } else {
                  var dataWithAdditional = itemProperties.getAdditional(data, cid, friends); // Not necessary to know friends because I process only devices underRequest!
                  if(dataWithAdditional.error){
                    callback(true, dataWithAdditional.message);
                  } else {
                    callback(false, dataWithAdditional.items);
                  }
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

  function getUserItems(reqId, reqCid, ownerCid, type, callback){
    var data = {};
    var parsedData = {};
    var items = [];
    var friends = [];

    userOp.findOne({_id: reqId, status: {$ne: 'deleted'}}, {hasItems: 1, cid: 1}).populate('hasItems.id','name accessLevel typeOfItem cid info avatar')
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

      if(type !== 'all'){
        if(relation === 1){
          items = items.filter(function(i){return  i.id.typeOfItem === type;});
        } else if(relation === 2){
          items = items.filter(function(i){return i.id.accessLevel === 2 && i.id.typeOfItem === type;});
        } else {
          items = items.filter(function(i){return i.id.typeOfItem === type;});
        }
      } else {
        if(relation === 1){
          items = items.filter(function(i){return i.id.accessLevel >= 1;});
        } else if(relation === 2){
          items = items.filter(function(i){return i.id.accessLevel === 2;});
        }
      }
      data.items = items;
      callback(false, data);
    })
    .catch(function(error){
      callback(true, error);
    });
  }

  /*
  Gets one item based on the OID
  Receives following parameters:
  - Organisation cid
  - Item oid
  */
  function getCount(id, cid, onlyUser, callback) {
    var result = {};
    var query = onlyUser ?
                {'uid.id': id} :
                {'cid.id': cid};
    query.status = {$nin: ['disabled', 'deleted']};
    query.typeOfItem = 'service';
    itemOp.count(query)
    .then(function(response){
      result.services = response;
      query.typeOfItem = 'device';
      return itemOp.count(query);
    })
    .then(function(response){
      result.devices = response;
      callback(false, result);
    })
    .catch(function(error){
      callback(true, error);
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
      friends.push(array[i].id.toString());
    }
  }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getOrgItems = getOrgItems;
module.exports.getItemWithAdd = getItemWithAdd;
module.exports.getUserItems = getUserItems;
module.exports.getArrayOfItems = getArrayOfItems;
module.exports.getMyContractItems = getMyContractItems;
module.exports.getItemsContracted = getItemsContracted;
module.exports.getCount = getCount;
