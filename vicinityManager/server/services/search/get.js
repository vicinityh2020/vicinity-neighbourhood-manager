// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemProperties = require("../../services/items/additionalItemProperties");
var semanticRepo = require("../../services/semanticRepo/request");
var asyncHandler = require('../../services/asyncHandler/sync');

// Public functions

  /*
  Looks for a substring match whithin the userAccount collection
  Organisation is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchOrganisation(sT, callback) {
    userAccountOp.find({$query: {name: sT}, $hint: { name : 1 }}, function(err, data) {
      if (err) {
        callback(true, err);
      } else {
        callback(false, data);
      }
    });
  }

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(sT, cid, callback) {
    var friends = [], query = {};

    userAccountOp.findById(cid, {knows:1})
    .then(function(response){
      var things = response.toObject();
      if(things){
        getOnlyId(friends, things.knows);
        query = {
          $or :[
          {$and: [ { 'cid.id': cid.id }, { accessLevel: 0 } ] },
          {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: 1 } ] },
          { accessLevel: 2 }
        ],
        name: {$regex: sT}
        };
        return userOp.find(query, {authentication:0});
      } else {
        return "Nothing";
      }
    })
    .then(function(response){
        callback(false, response);
    })
    .catch(function(err){
        callback(true, err);
    });
  }

  /*
  Looks for a substring match whithin the item collection
  Name is used as a index and it is the field we compare
  Access level restrictions apply!
  Text index are not used because do not support substring look up!
  */
  function searchItem(sT, cid, otherCids, callback) {
    var friends = []; // Will contain company partners and itself
    friends.push(cid);
    for(var i = 0; i < otherCids.length; i++){
      friends.push(mongoose.Types.ObjectId(otherCids[i]));
    }

    var query = {
      name: sT,
      $or :[
      {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: { $gt:0 } } ] },
      { accessLevel: { $gt:1 } },
      {$and: [ { 'cid.id': cid}, {accessLevel: 0} ] }
      ]
    };

    itemOp.find({$query: query ,$hint: { name : 1 }}).populate('cid.id','name').exec(function(err, data){
      if (!data || err) {
        callback(true, err);
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,cid,friends);
        callback(false, dataWithAdditional);
      }
    });
  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Excludes inferences
  */
  function searchInOntology(searchTerm, callback){
    semanticRepo.getSubclass(searchTerm)
    .then(function(response){ callback(false, response); })
    .catch(function(error){ callback(true, error); });
  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Includes inferences
  */
  function searchInOntologyWithInferences(searchTerm, callback){
    semanticRepo.getAllSubclass(searchTerm)
    .then(function(response){ callback(false, response); })
    .catch(function(error){ callback(true, error); });
  }

  /*
  Looks for valid subclasses in the ontology given a class (Type or thing)
  Asynchronous calls -- Input: Array
  */
  function getOidFromOntology(searchTerms, predicate, getGraph, callback){

    if(typeof searchTerms === "string"){ searchTerms = [searchTerms]; }

    return new Promise(function(resolve, reject) {
    if(searchTerms.length > 0){ // Check if there is any item to delete
      logger.debug('Start async handler...');
      asyncHandler.forEachAll(searchTerms,
        function(value, allresult, next, otherParams) {
          getOids(value, otherParams, function(value, result) {
              // logger.debug('END execution with value =', value, 'and result =', result);
              allresult.push({value: value, result: result});
              next();
          });
        },
        function(allresult) {
          if(allresult.length === searchTerms.length){
            // logger.debug('Completed async handler: ' + JSON.stringify(allresult));
            allresult = findUnique(allresult, getGraph);
            logger.debug(allresult);
            callback(false, allresult);
          }
        },
        false,
        {predicate: predicate, getGraph: getGraph}
      );
    } else {
      callback(false, "Nothing to be read...");
    }
  });
  }

/*
  Private functions
*/

// Supporting getOidFromOntology
function getOids(searchTerm, otherParams, callback){
  semanticRepo.getGraphOids(searchTerm, otherParams.predicate, otherParams.getGraph)
  .then(function(response){ callback(searchTerm, parseResponse(JSON.parse(response).data.results.bindings)); })
  .catch(function(error){ callback(searchTerm, "Error: " + error);
  });
}

// Supporting getOidFromOntology
function parseResponse(arr){
    try{
      var myTypes = [], myTypesCaption = []; // store types
      var pos_hash = 0, pos_slash = 0; // keeps position in the string where the actual type starts
      var aux = ""; // keeps the value for each iteration
      for(var i=0; i<arr.length; i++){
        aux = arr[i].s.value;
        pos_hash = aux.indexOf('#',0);
        myTypes.push(aux.substr(pos_hash+1));
      }
      return(myTypes);
    }
    catch(err)
    {
      return(["ERROR"]);
    }
}

// Supporting getOidFromOntology
function findUnique(arr, withGraph){
  var myArray = [];
  var aux;
  for(var i = 0; i < arr.length; i++){
    for(var j = 0; j < arr[i].result.length; j++){
      if(myArray.indexOf(arr[i].result[j]) === -1){
        if(!withGraph){
          myArray.push(arr[i].result[j]);
        } else {
          aux =  arr[i].result[j].replace("http://vicinity.eu/data/", "");
          myArray.push(aux);
        }
      }
    }
  }
  return myArray;
}

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
  module.exports.searchInOntology = searchInOntology;
  module.exports.searchInOntologyWithInferences = searchInOntologyWithInferences;
  module.exports.getOidFromOntology = getOidFromOntology;
