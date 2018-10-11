// Global objects and variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
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
    var cid =  mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var api = false; // Call origin api or webApp
    sGet.searchOrganisation(sT, cid,  api, function(err, response){
      if(err){
        logger.log(req,res,response);
        res.json({error: err, message: response.data});
      } else {
        res.json({error: err, message: response.data});
      }
    });
  }

  /*
  Looks for a substring match whithin the user collection
  Name is used as a index and it is the field we compare
  Text index are not used because do not support substring look up!
  */
  function searchUser(req, res, next) {
    var searchTerm = req.query.searchTerm;
    var cid =  mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var sT = new RegExp(searchTerm, 'i');
    var api = false; // Call origin api or webApp
    sGet.searchUser(sT, cid, api, function(err, response){
      if(err){
        logger.log(req,res,response);
        res.json({error: err, message: response.data});
      } else {
        res.json({error: err, message: response.data});
      }
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
    // var otherCids = req.body;
    var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
    var sT = new RegExp(searchTerm, 'i');
    var api = false; // Call origin api or webApp
    sGet.searchItem(sT, cid, api, function(err, response){
      if(err){
        logger.log(req,res,response);
        res.json({error: err, message: response.data});
      } else {
        res.json({error: err, message: response.data});
      }
    });
  }

  /*
  Gets ontology hierarchy
  From file stored and updated every day in server
  If above method fails, gets file from backup stored in code
  */
  function getOntology(req, res, next) {
    sGet.getOntology()
    .then(function(response){
      res.json({error: false, message: response});
    })
    .catch(function(err){
      res.json({error: true, message: err});
    });
  }

// Export modules

  module.exports.searchOrganisation = searchOrganisation;
  module.exports.searchUser = searchUser;
  module.exports.searchItem = searchItem;
  module.exports.getOntology = getOntology;
