// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var sGet = require("../../services/search/get");

// Public functions

  /*
  Looks for a substring match whithin the userAccount collection
  Organisation is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchOrganisation(req, res, next) {
    var searchTerm = req.query.searchTerm;
    var sT = new RegExp(searchTerm, 'i');
    sGet.searchOrganisation(sT, function(err, response){
      res.json({error: err, message: response});
    });
  }

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(req, res, next) {
    var searchTerm = req.query.searchTerm;
    var cid = req.query.cid;
    var sT = new RegExp(searchTerm, 'i');
    sGet.searchUser(sT, cid, function(err, response){
      res.json({error: err, message: response});
    });
  }

  /*
  Looks for a substring match whithin the item collection
  Name is used as a index and it is the field we compare
  Access level restrictions apply!
  Text index are not used because do not support substring look up!
  */
  function searchItem(req, res, next) {
    var searchTerm = req.query.searchTerm;
    var otherCids = req.body;
    var cid = mongoose.Types.ObjectId(req.params.cid);
    var sT = new RegExp(searchTerm, 'i');
    sGet.searchItem(sT, cid, otherCids, function(err, response){
      res.json({error: err, message: response});
    });
  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Excludes inferences
  */
  function searchInOntology(req, res, next){
    var searchTerm = req.query.searchTerm;
    sGet.searchInOntology(searchTerm, function(err, response){
      res.json({error: err, message: response});
    });
  }

  /*
  Looks for valid subclasses and types in the ontology given a class (Type or thing)
  Includes inferences
  */
  function searchInOntologyWithInferences(req, res, next){
    var searchTerm = req.query.searchTerm;
    sGet.searchInOntologyWithInferences(searchTerm, function(err, response){
      res.json({error: err, message: response});
    });
  }

  /*
  Looks for valid subclasses in the ontology given a class (Type or thing)
  Asynchronous calls -- Input: Array
  */
  function getOidFromOntology(req, res, next){
    var searchTerms = req.body.searchTerm;
    var predicate = req.body.predicate;
    var getGraph = req.body.getGraph;
    sGet.getOidFromOntology(searchTerms, predicate, getGraph, function(err, response){
      res.json({error: err, message: response});
    });
  }

// Export modules

  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
  module.exports.searchInOntology = searchInOntology;
  module.exports.searchInOntologyWithInferences = searchInOntologyWithInferences;
  module.exports.getOidFromOntology = getOidFromOntology;
