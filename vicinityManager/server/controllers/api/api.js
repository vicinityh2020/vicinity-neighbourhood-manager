// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");

var sGetSearch = require("../../services/search/get");
var sPublic = require("../../services/public/statistics");


// Main functions - VCNT API

/*
Search --------------------------------------------------
*/

/**
 * Search organisations
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of orgs
 */
exports.searchOrgs = function(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var cid =  mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var sT = new RegExp(searchTerm, 'i');
  var api = true; // Call origin api or webApp
  sGetSearch.searchOrganisation(sT, cid, api, function(err, response){
    res.json({error: err, message: response});
  });
};

/**
 * Search users
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of users
 */
exports.searchUsers = function(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var cid =  mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var sT = new RegExp(searchTerm, 'i');
  var api = true; // Call origin api or webApp
  sGetSearch.searchUser(sT, cid, api, function(err, response){
    res.json({error: err, message: response});
  });
};

/**
 * Search items
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of items
 */
exports.searchItems = function(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var sT = new RegExp(searchTerm, 'i');
  var api = true; // Call origin api or webApp
  sGetSearch.searchItem(sT, cid, api, function(err, response){
    res.json({error: err, message: response});
  });
};

/*
Public --------------------------------------------------
*/

/**
 * Get statistics
 * @return {Object} JSON with NM statistics
 */
exports.getStatistics = function(req, res, next) {
  sPublic.getStatistics(function(err, response){
    if(err) logger.log(req, res, response);
    res.json({error: err, message: response});
  });
};
