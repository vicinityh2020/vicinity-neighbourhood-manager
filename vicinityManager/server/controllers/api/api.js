// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sLogin = require("../../services/login/login");
var sRegister = require("../../services/registrations/register.js");
var sInviteUser = require("../../services/invitations/invitations.js");
var sGetNodeItems = require("../../services/nodes/get.js");
var sFriending = require("../../services/organisations/friending");
var sGetUser = require("../../services/users/getUsers");
var sGetItems = require("../../services/items/get");
var sGetOrganisation = require("../../services/organisations/get");
var sGetSearch = require("../../services/search/get");

// Main functions - VCNT API

/*
Authenticate --------------------------------------------------
*/

/**
 * Authenticates a user. Check user and password.
 *
 * @param {Object} data
 * password, userName
 * @return {String} token
 */
function authenticate(req, res, next) {
  var userName = req.body.username;
  var userRegex = new RegExp("^" + userName.toLowerCase(), "i");
  var pwd = req.body.password;
  sLogin.authenticate(userName, userRegex, pwd, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Organisations --------------------------------------------------
*/

/**
 * Get all organisations
 *
 * @param null
 *
 * @return {Object} Array of organisations
 */
function getOrganisations(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = 0; // 0 all, 1 friends, else not friends
  sGetOrganisation.getAll(cid, type, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Get organisation friends
 *
 * @param null
 *
 * @return {Object} Array of organisations
 */
function getFriends(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = 1; // 0 all, 1 friends, else not friends
  sGetOrganisation.getAll(cid, type, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Get organisation users
 *
 * @param {String} cid
 *
 * @return {Object} Array of users
 */
function getUsers(req, res, next) {
  var othercid = mongoose.Types.ObjectId(req.params.id);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  sGetUser.getAll(othercid, mycid, function(err,response){
    res.json({error: err, message: response});
  });
}

/**
 * Get organisation users
 *
 * @param {String} id
 * @param {String} type (query)
 * @param {String} offset (query)
 * @param {String} limit (query)
 *
 * @return {Object} Array of items
 */
function getItems(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.params.id);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var limit = req.query.limit === undefined ? 0 : req.query.limit;
  var offset = req.query.offset === undefined ? 0 : req.query.offset;
  var type = (req.query.type === undefined || (req.query.type !== "device" && req.query.type !== "service")) ? "all" : req.query.type;
  var api = true; // Call origin api or webApp
  sGetItems.getOrgItems(cid, mycid, type, offset, limit, api, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Creates a registration request that needs to be approved
 *
 * @param {Object} data
 * password, userName, email, occupation, companyName, companyLocation,
 * businessId, termsAndConditions
 * @return {String} Acknowledgement
 */
function createOrganisation(req, res, next) {
  var data = req.body;
  data.type = "newCompany";
  sRegister.requestReg(data, function(err, response){
    res.json({error: err, message: response});
  });
}

function removeOrganisation(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Users --------------------------------------------------
*/

function getUser(req, res, next) {
  res.json({error: false, message: "Endpoint under development..."});
}

/**
 * Get user items
 *
 * @param {String} uid
 * @param {String} cid
 * @param {String} type (query)
 * @return {Object} Array of items
 */
function getUserItems(req, res, next) {
  var reqId = mongoose.Types.ObjectId(req.params.uid);
  var reqCid = mongoose.Types.ObjectId(req.params.cid);
  var myCid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var type = (req.query.type === undefined || (req.query.type !== "device" && req.query.type !== "service")) ? "all" : req.query.type;
  sGetItems.getUserItems(reqId, reqCid, myCid, type, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Invites a user
 *
 * @param {Object} data
 * organisation, emailTo, nameTo
 * @return {String} Acknowledgement
 */
function createUser(req, res, next) {
  var userName = req.body.decoded_token.sub;
  var cid = req.body.decoded_token.cid;
  var companyId = req.body.decoded_token.orgid;
  var organisation = req.body.organisation; // name
  var emailTo = req.body.emailTo;
  var nameTo = req.body.nameTo;
  var type = "newUser";
  sInviteUser.postOne(userName, companyId, cid, organisation, emailTo, nameTo, type, function(err, response){
    res.json({error: err, message: response});
  });
}

function updateUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function removeUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Items --------------------------------------------------
*/

function getItem(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

function createItem(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

function updateItem(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

function removeItem(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

/*
Agents --------------------------------------------------
*/

/**
 * Get agent items
 *
 * @param {Object} data
 * adid
 * @return {Object} TDs -- Array of Objects, adid -- String
 */
function getAgentUsers(req, res, next) {
  var adid = req.body;
  // TODO check if the requester org is authorized to see the agent items
  sGetNodeItems.getNodeItems(adid, function(err, response){
    res.json({error: err, message: response});
  });
}

function createAgent(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

function removeAgent(req, res, next) {
    res.json({error: false, message: "Use agent..."});
}

/*
Friending --------------------------------------------------
*/

/**
 * Get friendship notifications
 *
 * @param null
 *
 * @return {Object} Friendship notifications
 */
function partnershipFeeds(req, res, next) {
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  sFriending.friendshipFeeds(my_id, function(err, response){
    res.json({"error": err, "message": response});
  });
}

/**
 * Request fiendship
 *
 * @param {String} friend_id
 *
 * @return {String} Acknowledgement
 */
function requestPartnership(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.body.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  sFriending.processFriendRequest(friend_id, my_id, my_mail, function(err, response){
    res.json({"error": err, "message": response});
  });
}

/**
 * Manage friendships
 *
 * @param {String} friend_id
 * @param {String} type
 *
 * @return {String} Acknowledgement
 */
function managePartnership(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.body.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var type = req.body.type;

  switch(type) {
    case "accept":
        sFriending.acceptFriendRequest(friend_id, my_id, my_mail, function(err, response){
          res.json({"error": err, "message": response});
        });
        break;
    case "reject":
        sFriending.rejectFriendRequest(friend_id, my_id, my_mail, function(err, response){
          res.json({"error": err, "message": response});
        });
        break;
    case "cancelRequest":
        sFriending.cancelFriendRequest(friend_id, my_id, my_mail, function(err, response){
          res.json({"error": err, "message": response});
        });
        break;
    case "cancel":
        sFriending.cancelFriendship(friend_id, my_id, my_mail, function(err, response){
          res.json({"error": err, "message": response});
        });
        break;
    default:
      res.json({"error": true, "message": "Wrong type"});
      break;
    }
}

/*
Contracts --------------------------------------------------
*/

function contractFeeds(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function requestContract(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function manageContract(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Contracts --------------------------------------------------
*/
/**
 * Search organisations
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of orgs
 */
function searchOrgs(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var sT = new RegExp(searchTerm, 'i');
  sGetSearch.searchOrganisation(sT, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Search users
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of users
 */
function searchUsers(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var cid =  mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var sT = new RegExp(searchTerm, 'i');
  sGetSearch.searchUser(sT, cid, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Search items
 *
 * @param {String} searchTerm (query)
 *
 * @return {Object} Array of items
 */
function searchItems(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var sT = new RegExp(searchTerm, 'i');
  var api = true; // Call origin api or webApp
  sGetSearch.searchItem(sT, cid, api, function(err, response){
    res.json({error: err, message: response});
  });
}

// Export functions --------------------------------------------------

module.exports.authenticate = authenticate;

module.exports.getOrganisations = getOrganisations;
module.exports.getFriends = getFriends;
module.exports.getUsers = getUsers;
module.exports.getItems = getItems;
module.exports.createOrganisation = createOrganisation;
module.exports.removeOrganisation = removeOrganisation;

module.exports.getUser = getUser;
module.exports.getUserItems = getUserItems;
module.exports.createUser = createUser;
module.exports.updateUser = updateUser;
module.exports.removeUser = removeUser;

module.exports.getItem = getItem;
module.exports.createItem = createItem;
module.exports.updateItem = updateItem;
module.exports.removeItem = removeItem;

module.exports.getAgentUsers = getAgentUsers;
module.exports.createAgent = createAgent;
module.exports.removeAgent = removeAgent;

module.exports.partnershipFeeds = partnershipFeeds;
module.exports.requestPartnership = requestPartnership;
module.exports.managePartnership = managePartnership;

module.exports.contractFeeds = contractFeeds;
module.exports.requestContract = requestContract;
module.exports.manageContract = manageContract;

module.exports.searchOrgs = searchOrgs;
module.exports.searchUsers = searchUsers;
module.exports.searchItems = searchItems;
