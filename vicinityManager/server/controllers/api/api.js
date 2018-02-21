// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sLogin = require('../../services/login/login');
var sRegister = require("../../services/registrations/register.js");
var sInviteUser = require("../../services/invitations/invitations.js");
var sGetNodeItems = require("../../services/nodes/get.js");

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

function getFriends(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function getUsers(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function getDevices(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function getServices(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/**
 * Creates a registration request that needs to be approved
 *
 * @param {Object} data
 * password, userName, email, occupation, companyName, companyLocation,
 * businessId, termsAndConditions, type = newCompany
 * @return {String} Acknowledgement
 */
function createOrganisation(req, res, next) {
  var data = req.body;
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

function getUserItems(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/**
 * Invites a user
 *
 * @param {Object} data
 * organisation, emailTo, nameTo
 * @return {String} Acknowledgement
 */
function createUser(req, res, next) {
  var userName = req.body.decoded_token.name;
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
    res.json({error: false, message: "Endpoint under development..."});
}

function createItem(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function updateItem(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function removeItem(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
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
    res.json({error: false, message: "Endpoint under development..."});
}

function removeAgent(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Friending --------------------------------------------------
*/

function partnershipFeeds(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function requestPartnership(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function managePartnership(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
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

// Export functions --------------------------------------------------

module.exports.authenticate = authenticate;

module.exports.getFriends = getFriends;
module.exports.getUsers = getUsers;
module.exports.getDevices = getDevices;
module.exports.getServices = getServices;
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
