// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var itemProperties = require("../../helpers/items/additionalItemProperties");
var semanticRepo = require("../../helpers/semanticRepo/request");
var asyncHandler = require('../../helpers/asyncHandler/sync');

// Public functions

  /*
  Looks for a substring match whithin the userAccount collection
  Organisation is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchOrganisation(req, res, next) {
    var response = {};
    var searchTerm = req.query.searchTerm;
    var sT = new RegExp(searchTerm, 'i');
    // logger.debug(searchTerm);
    userAccountOp.find({$query: {name: sT}, $hint: { name : 1 }}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  }

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(req, res, next) {
    var response = {};
    var searchTerm = req.query.searchTerm;
    var cid = mongoose.Types.ObjectId(req.query.cid);
    var sT = new RegExp(searchTerm, 'i');
    var friends = [], query = {};

    userAccountOp.findById(cid, {knows:1})
    .then(function(response){
      friends = response.knows;
      query = {
        $or :[
        {$and: [ { 'cid.id': cid }, { accessLevel: 0 } ] },
        {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: 1 } ] },
        { accessLevel: 2 }
      ],
      name: {$regex: sT}
      };
      return userOp.find(query);
    })
    .then(function(response){
        res.json({"error": false, "message": response});
    })
    .catch(function(error){
        res.json({"error": true, "message": error});
    });
  }

  /*
  Looks for a substring match whithin the item collection
  Name is used as a index and it is the field we compare
  Access level restrictions apply!
  Text index are not used because do not support substring look up!
  */
  function searchItem(req, res, next) {
    var response = {};
    var friends = []; // Will contain company partners and itself
    var searchTerm = req.query.searchTerm;
    var cid = mongoose.Types.ObjectId(req.params.cid);
    var sT = new RegExp(searchTerm, 'i');

    friends.push(cid);
    var i = 0;
    for(i; i < req.body.length; i++){
      friends.push(mongoose.Types.ObjectId(req.body[i]));
    }

    var query = {
      name: sT,
      $or :[
      {$and: [ { 'cid.id': {$in: friends}}, { accessLevel: {$in: [2, 3, 4]} } ] },
      { accessLevel: { $gt:4 } },
      {$and: [ { 'cid.id': cid}, {accessLevel: 1} ] }
      ]
    };

    itemOp.find({$query: query ,$hint: { name : 1 }}).populate('hasAdministrator','organisation').exec(function(err, data){
      if (!data ||err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,cid,friends);
        response = {"error": false, "message": dataWithAdditional};
      }
      res.json(response);
    });

  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Excludes inferences
  */
  function searchInOntology(req, res, next){
    var searchTerm = req.query.searchTerm;
    semanticRepo.getSubclass(searchTerm)
    .then(function(response){ res.json({'status':'success', 'message': response }); })
    .catch(function(error){ res.json({'status':'error', 'message': error }); });
  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Includes inferences
  */
  function searchInOntologyWithInferences(req, res, next){
    var searchTerm = req.query.searchTerm;
    semanticRepo.getAllSubclass(searchTerm)
    .then(function(response){ res.json({'status':'success', 'message': response }); })
    .catch(function(error){ res.json({'status':'error', 'message': error }); });
  }

  /*
  Looks for valid subclasses in the ontology given a class (Type or thing)
  Asynchronous calls -- Input: Array
  */
  function getOidFromOntology(req, res, next){
    var searchTerms = req.body.searchTerm;
    var predicate = req.body.predicate;
    var getGraph = req.body.getGraph;

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
            res.json({ "error": false, "message": allresult });
          }
        },
        false,
        {predicate: predicate, getGraph: getGraph}
      );
    } else {
      res.json({"error": false, "message": "Nothing to be read..."});
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

// Export modules

  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
  module.exports.searchInOntology = searchInOntology;
  module.exports.searchInOntologyWithInferences = searchInOntologyWithInferences;
  module.exports.getOidFromOntology = getOidFromOntology;
