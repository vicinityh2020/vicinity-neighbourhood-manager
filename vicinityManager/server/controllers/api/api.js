// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");

var sLogin = require('../../services/login/login');

// Main functions - VCNT API

/*
Authenticate
*/

/* Check user and password. */
function authenticate(req, res, next) {
  var userName = req.body.username;
  var userRegex = new RegExp("^" + userName.toLowerCase(), "i");
  var pwd = req.body.password;
  sLogin.authenticate(userName, userRegex, pwd, function(err, response){
    res.json({error: err, message: response});
  });
}

/*
Organisations
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

function createOrganisation(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function removeOrganisation(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Users
*/

function getUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function getUserItems(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function createUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function updateUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function removeUser(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Items
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
Agents
*/

function getAgentUsers(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function createAgent(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

function removeAgent(req, res, next) {
    res.json({error: false, message: "Endpoint under development..."});
}

/*
Contracts
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
Friending
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

// Export functions

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
