// Global objects and variables

var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemProperties = require("../../services/items/additionalItemProperties");
var semanticRepo = require("../../services/semanticRepo/request");
var asyncHandler = require('../../services/asyncHandler/sync');
var map = require("../../configuration/map");

// Public functions

  /*
  Looks for a substring match whithin the userAccount collection
  Organisation is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchOrganisation(sT, cid, api, callback) {
    var projection = {};
    var friends = [];
    if(api){
      projection.name = 1;
      projection.cid = 1;
    } else {
      projection.skinColor = 0;
    }

    userAccountOp.findById(cid, {knows:1})
    .then(function(response){
      try{
        getOnlyId(friends, response.knows.toObject());
        return userAccountOp.find({$query: {name: sT}, $hint: { name : 1 }}, projection);
      } catch(err){
        return Promise.reject(err);
      }
    })
    .then(function(data){
      for(var i = 0, l = data.length; i < l; i++){
        data[i]._doc.friend = friends.indexOf(data[i]._id.toString()) !== -1;
      }
      callback(false, {data: data, type: "info"});
    })
    .catch(function(err){
      callback(true, {data: err, type: "error"});
    });
  }

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(sT, cid, api, callback) {
    var friends = [], query = {};
    var projection = {};
    if(api){
      projection.name = 1;
      projection.uid = 1;
      projection.cid = 1;
      projection.email = 1;
    } else { projection.authentication = 0; }

    userAccountOp.findById(cid, {knows:1})
    .then(function(response){
      var things = response.toObject();
      if(!things){ things.knows = []; }
      try{
        getOnlyId(friends, things.knows);
        query = {
          $or :[
          {$and: [ { 'cid.id': cid }, { accessLevel: { $gte:0 } } ] },
          {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: { $gte:1 } } ] },
          { accessLevel: { $gte:2 } }
        ],
        name: {$regex: sT}
        };
        return userOp.find(query, projection);
      } catch(err){
        return Promise.reject(err);
      }
    })
    .then(function(response){
      callback(false, {data: response, type: "info"});
    })
    .catch(function(err){
      callback(true, {data: err, type: "error"});
    });
  }

  /*
  Looks for a substring match whithin the item collection
  Name is used as a index and it is the field we compare
  Access level restrictions apply!
  Text index are not used because do not support substring look up!
  */
  function searchItem(sT, cid, api, callback) {
    var friends = [], query = {}; // Will contain company partners and itself
    var projection;
    userAccountOp.findById(cid, {knows:1})
    .then(function(response){
      var things = response.toObject();
      if(!things){ things.knows = []; }
      try{
        getOnlyId(friends, things.knows);
        query = {
          $or :[
          {$and: [ { 'cid.id': cid }, { accessLevel: { $gte:0 } } ] },
          {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: { $gte:1 } } ] },
          { accessLevel: { $gte:2 } }
        ],
        name: {$regex: sT}
        };

        if(api){
          projection = { avatar: 0, hasContracts: 0, hasAudits: 0 };
        } else {
          projection = { hasAudits: 0 };
        }
        return itemOp.find(query).select(projection).populate('cid.id','name');
      } catch(err){
        return Promise.reject(err);
      }
    })
    .then(function(data){
      if(api){
        callback(false, {data: data, type: "info"});
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,cid,friends);
        callback(false, {data: dataWithAdditional, type: "info"});
      }
    })
    .catch(function(err){
      callback(true, {data: err, type: "error"});
    });
  }

  /*
  Gets ontology hierarchy
  From file stored and updated every day in server
  If above method fails, gets file from backup stored in code
  */
  function getOntology() {
    // TODO get from file in server
    return new Promise(function(resolve, reject) {
      resolve(map.hierarchy);
    });
  }

/*
  Private functions
*/

function getOnlyId(array, toAdd){
  for(var i = 0; i < toAdd.length; i++){
    if(toAdd[i].hasOwnProperty("id")){
      array.push(toAdd[i].id.toString());
    } else {
      array.push(toAdd[i]._id.toString());
    }
  }
}

// Export modules

  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
  module.exports.getOntology = getOntology;
