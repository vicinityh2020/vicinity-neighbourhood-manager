// Global variables

var mongoose = require('mongoose');
var logger = require("../../middlewares/logger");
var userOp = require("../../models/vicinityManager").user;
var userAccountOp = require("../../models/vicinityManager").userAccount;

var sLogin = require("../../services/login/login");
var sRegister = require("../../services/registrations/register.js");
var sGetNodeItems = require("../../services/nodes/get.js");
var sCreateNode = require("../../services/nodes/post.js");
var sRemoveNode = require("../../services/nodes/processNode.js");
var sFriending = require("../../services/organisations/friending");
var sGetUser = require("../../services/users/getUsers");
var sInviteUser = require("../../services/invitations/invitations.js");
var sPutUser = require('../../services/users/putUsers');
var delUser = require('../../services/users/deleteUsers');
var sGetItems = require("../../services/items/get");
var sGetAgents = require("../../services/nodes/get");
var sGetOrganisation = require("../../services/organisations/get");
var sGetSearch = require("../../services/search/get");
var sOrgConfiguration = require('../../services/organisations/configuration');
var sItemUpdate = require('../../services/items/update');
var ctHelper = require("../../services/contracts/contracts.js");
var ctChecks = require("../../services/contracts/contractChecks.js");

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
  sLogin.authenticate(userName, userRegex, pwd, function(err, response, other){
    if(err){
      res.json({error: err, message: response});
    } else {
      response.uid = other.uid;
      response.cid = other.cid;
      res.json({error: err, message: response});
    }
  });
}

/*
Organisations --------------------------------------------------
*/

/**
 * Get my organisation
 *
 * @param null
 *
 * @return {Object} My organisation
 */
function getMyOrganisation(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  userAccountOp.findOne({_id: cid}, {name:1, cid:1, accountOf:1, knows:1, hasNodes:1}, function(err, response){
    if(!err){
      res.json({error: false, message: response});
    } else {
      res.json({error: true, message: err});
    }
  });
}

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
  var api = true;
  sGetOrganisation.getAll(cid, type, api, function(err, response){
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
  var api = true;
  sGetOrganisation.getAll(cid, type, api, function(err, response){
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
  var othercid = mongoose.Types.ObjectId(req.params.cid);
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var api = true;
  sGetUser.getAll(othercid, mycid, api, function(err,response){
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
  var cid = mongoose.Types.ObjectId(req.params.cid);
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
 * Get organisation users
 *
 * @param {String} id
 *
 * @return {Object} Array of agents
 */
function getAgents(req, res, next) {
  var mycid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var api = true; // Call origin api or webApp
  sGetAgents.getOrgAgents(mycid, api, function(err, response){
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
  var finalRes;
  data.type = "newCompany";
  sRegister.findDuplicatesUser(data)
  .then(function(dup){
    if(!dup){
      return sRegister.findDuplicatesCompany(data);
    }else{
      finalRes = {error: false, message: "Mail already registered"};
      return true; // Duplicates found at mail stage
    }
  }).then(function(dup){
    if(!dup){
      sRegister.requestReg(data, function(err, response){
        res.json({error: err, message: response});
      });
    }else{
      if(typeof finalRes !== "object"){ finalRes = {error: false, message: "Company name or business ID already exist"}; } // Dups found at org stage
      res.json(finalRes);
    }
  }).catch(function(err){
    res.json({error: true, message: err});
  });
}

/**
 * Removes an organisation
 *
 * @param {Object} null
 *
 * @return {String} Acknowledgement
 */
function removeOrganisation(req, res, next) {
  var cid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var mail = req.body.decoded_token.sub;
  if(req.body.decoded_token.roles.indexOf('administrator') === -1){
    res.json({'error': false, 'message': "Need admin privileges to remove an organisation..."});
  } else {
    sOrgConfiguration.remove(cid, mail, function(err, data){
      res.json({"error": err, "message": data});
    });
  }
}

/*
Users --------------------------------------------------
*/

function getUser(req, res, next) {
  var reqId = req.params.uid || req.body.decoded_token.uid;
  var uid = mongoose.Types.ObjectId(reqId);
  var myUid = mongoose.Types.ObjectId(req.body.decoded_token.uid);
  var myCid = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  sGetUser.getUserInfo(uid, myUid, myCid, function(err, response){
    res.json({error: err, message: response});
  });
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

/**
 * Update a user
 *
 * @param {String} uid
 * @param {Object} Data and type
 *
 * @return {String} Acknowledgement
 */
function updateUser(req, res, next) {
  var o_id = mongoose.Types.ObjectId(req.params.uid);
  var updates = req.body.data;
  var userMail = req.body.decoded_token.sub;
  var userId = req.body.decoded_token.uid;
  var roles = req.body.decoded_token.roles;
  var cid = req.body.decoded_token.cid;
  var type = req.body.type;

  userOp.findOne({_id:o_id}, {email:1, cid:1}, function(err, response){
    if(err){
      res.json({error: true, message: err, success: false});
    } else if((response.email === userMail) || (response.cid.extid === cid && roles.indexOf('administrator') !== -1)) {
      if(type === 'undefined' || type === ""){
        res.json({error: false, message: 'Type of update not defined...', success: false});
      } else {
        sPutUser.putOne(o_id, updates, userMail, userId, type, function(err, response, success){
          if(err){
            res.json({error: err, message: response, success: success});
          } else if(!success){
            res.json({error: err, message: response, success: success});
          } else {
            res.json({error: err, message: "User updated: " + response.email, success: success});
          }
        });
      }
    } else {
      res.json({error: false, message: 'Not authorized to update this user...', success: false});
    }
  });
}

/**
 * Deletes a user
 *
 * @param {String} uid
 *
 * @return {String} Acknowledgement
 */
function removeUser(req, res, next) {
  var uid = [];
  var email = req.body.decoded_token.sub;
  var my_cid = req.body.decoded_token.orgid;
  var finalResp;
  uid.push(mongoose.Types.ObjectId(req.params.uid));
  if(req.body.decoded_token.roles.indexOf('administrator') === -1){
    res.json({'error': false, 'message': "Need admin privileges to remove a user..."});
  } else if(req.params.uid.toString() === req.body.decoded_token.uid.toString()){
    res.json({'error': false, 'message': "You cannot remove yourself..."});
  } else {
    delUser.isMyUser(my_cid, req.params.uid) // Check if user belongs to me
    .then(function(response){
      if(response){
        finalRes = "User removed";
        return delUser.deleteAllUsers(uid, email);
      } else {
        finalRes = "User does not belong to you";
        return false; // User does not belong to you
      }
    })
    .then(function(response){
      res.json({'error': false, 'message': finalRes});
    })
    .catch(function(err){
        res.json({'error': true, 'message': err});
    });
  }
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

/**
 * Update a user
 *
 * @param {Array} uids + thing to update
 *
 * @return {String} Acknowledgement
 */
function updateItem(req, res, next) {
  var email = req.body.decoded_token.sub;
  var cid = req.body.decoded_token.cid;
  var c_id = req.body.decoded_token.orgid;
  var uid = mongoose.Types.ObjectId(req.body.decoded_token.uid);

  if(req.body.multi){
   sItemUpdate.updateManyItems(req.body.items, req.body.decoded_token.roles, email, cid, c_id, uid, function(err, response, success){
    res.json({error: err, message: response, success: success});
   });
  }else if(req.body.status === 'enabled'){
    sItemUpdate.enableItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }else if(req.body.status === 'disabled'){
    sItemUpdate.disableItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }else{
    sItemUpdate.updateItem(req.body, {roles: req.body.decoded_token.roles, email: email, cid:cid, c_id:c_id, uid:uid}, function(err, response, success){
      res.json({error: err, message: response, success: success});
    });
  }
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
function getAgentItems(req, res, next) {
  var adid = req.params.id;
  // TODO check if the requester org is authorized to see the agent items
  sGetNodeItems.getNodeItems(adid, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Get agent items
 *
 * @param {Object} data
 * name
 * pass
 * eventUri -- Not necessary
 * agent -- Not necessary
 * type
 *
 * @return {Object} AGID and status
 */
function createAgent(req, res, next) {
  var company_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var cid = req.body.decoded_token.cid;
  var userMail = req.body.decoded_token.sub !== 'undefined' ? req.body.decoded_token.sub : "unknown";
  var userId = req.body.decoded_token.uid !== 'undefined' ? req.body.decoded_token.uid : "unknown";
  sCreateNode.postOne(req.body.data, company_id, cid, userMail, userId, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Get agent items
 *
 * @param {String} agid
 *
 * @return {Object} AGID and status
 */
function removeAgent(req, res, next) {
  var agid = [];
  agid.push(req.params.id);
  var company_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var cid = req.body.decoded_token.cid;
  var userMail = req.body.decoded_token.sub !== 'undefined' ? req.body.decoded_token.sub : "unknown";
  var userId = req.body.decoded_token.uid !== 'undefined' ? req.body.decoded_token.uid : "unknown";
  // TODO check if the requester org is authorized to see the agent items
  sRemoveNode.deleteNode(agid, userMail, userId)
  .then(function(response){
    res.json(response);
  })
  .catch(function(err){
    res.json({error: true, message: err});
  });
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
 * Request friendship
 *
 * @param {String} friend_id
 *
 * @return {String} Acknowledgement
 */
function requestPartnership(req, res, next) {
  var friend_id = mongoose.Types.ObjectId(req.body.id);
  var my_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var my_mail = req.body.decoded_token.sub;
  var my_uid = req.body.decoded_token.uid;
  sFriending.friendshipStatus(my_id, friend_id.toString(), function(err, response){
    if(err){
      res.json({"error": true, "message": err });
    } else if(response.imFriend){
      res.json({"error": false, "message": "You are already friend with " + friend_id });
    } else if(response.sentReq || response.haveReq){
      res.json({"error": false, "message": "You already have an open friending process with " + friend_id });
    } else {
      sFriending.processFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
        res.json({"error": err, "message": response});
      });
    }
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
  var my_uid = req.body.decoded_token.uid;
  var type = req.body.type;
  sFriending.friendshipStatus(my_id, friend_id.toString(), function(err, response){
    if(err){
      logger.debug(response);
      res.json({"error": true, "message": err });
    } else {
      switch(type) {
        case "accept":
            if(response.haveReq){
              sFriending.acceptFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                res.json({"error": err, "message": response});
              });
            } else {
              res.json({"error": false, "message": "You do not have friend requests from " + friend_id});
            }
            break;
        case "reject":
          if(response.haveReq){
              sFriending.rejectFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                res.json({"error": err, "message": response});
              });
            } else {
              res.json({"error": false, "message": "You do not have friend requests from " + friend_id});
            }
            break;
        case "cancelRequest":
            if(response.sentReq){
              sFriending.cancelFriendRequest(friend_id, my_id, my_mail, my_uid, function(err, response){
                res.json({"error": err, "message": response});
              });
            } else {
              res.json({"error": false, "message": "You have not sent requests to " + friend_id});
            }
            break;
        case "cancel":
            if(response.imFriend){
              sFriending.cancelFriendship(friend_id, my_id, my_mail, my_uid, function(err, response){
                res.json({"error": err, "message": response});
              });
            } else {
              res.json({"error": false, "message": "You do not have a friendship with " + friend_id});
            }
            break;
        default:
          res.json({"error": false, "message": "Wrong type"});
          break;
        }
      }
    });
}

/*
Contracts --------------------------------------------------
*/

/**
 * Contract requests
 * @return {Array} Open Contracts
 */
function contractFeeds(req, res, next) {
  ctHelper.contractFeeds(req.body.decoded_token.uid, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Get contract info
 * @param {String} ctid
 *
 * @return {Object} Contract Info
 */
function contractInfo(req, res, next) {
  ctHelper.contractInfo(req.params.ctid, req.body.decoded_token.uid, function(err, response){
    res.json({error: err, message: response});
  });
}

/**
 * Post contract
 *
 * @param {String} readWrite
 * @param {Object} serviceProvider
 * @param {Object} iotOwner
 *
 * Object contains:
 * cidService, uidService, [oidService]
 * cidDevice, uidDevice, [oidDevices]
 * readWrite (Boolean)
 *
 * @return {String} Acknowledgement
 */
function requestContract(req, res, next) {
  var data = req.body;
  var uid = req.body.decoded_token.uid;
  var cid = req.body.decoded_token.orgid;
  ctChecks.postCheck(data, uid, cid, function(error, response, success){
    if(error){
      res.json({error: error, message: response});
    } else if(!success){
      res.json({error: error, message: response});
    } else {
      ctHelper.creating(data, function(err, response){
        res.json({error: err, message: response});
      });
    }
  });
}

/**
 * Manage contract -- Update or remove
 *
 * @param {String} type - update/delete/accept
 * @param {String} ctid
 * @param {Object} body - only in case of update
 * IF TYPE IS Update add:
 * cidService, uidService, [oidService]
 * cidDevice, uidDevice, [oidDevices]
 * readWrite (Boolean)
 *
 * @return {String} Acknowledgement
 */
function manageContract(req, res, next) {
  var id, data;
  var uid = req.body.decoded_token.uid;
  var cid = req.body.decoded_token.orgid;
  if(req.body.type === 'delete'){
    id = req.params.id;
    ctChecks.deleteCheck(id, uid, cid, function(error, response, success){
      if(error){
        res.json({error: error, message: response});
      } else if(!success){
        res.json({error: error, message: response});
      } else {
        ctHelper.removing(id, function(err, response){
          res.json({error: err, message: "Contract successfully removed"});
        });
      }
    });
  } else if(req.body.type === 'accept') {
    id = req.params.id;
    ctChecks.acceptCheck(id, uid, cid, function(error, response, success){
      if(error){
        res.json({error: error, message: response});
      } else if(!success){
        res.json({error: error, message: response});
      } else {
          ctHelper.accepting(id, function(err, response){
          res.json({error: err, message: response});
        });
      }
    });
  } else if(req.body.type === 'update'){
    id = req.params.id;
    data = req.body;
    delete req.body.type;
    // UPDATE
    ctChecks.updateCheck(id, data, uid, cid, function(error, response, success){
      if(error){
        res.json({error: error, message: response});
      } else if(!success){
        res.json({error: error, message: response});
      } else {
        ctHelper.removing(id, function(err, response){
          if(err){
            res.json({error: err, message: response});
          } else {
            ctHelper.creating(data, function(err, response){
              res.json({error: err, message: response});
            });
          }
        });
      }
    });
  } else {
    res.json({error: false, message: "Wrong type. Please choose among update, accept and delete"});
  }
}

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
function searchOrgs(req, res, next) {
  var searchTerm = req.query.searchTerm;
  var sT = new RegExp(searchTerm, 'i');
  var api = true; // Call origin api or webApp
  sGetSearch.searchOrganisation(sT, api, function(err, response){
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
  var api = true; // Call origin api or webApp
  sGetSearch.searchUser(sT, cid, api, function(err, response){
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

module.exports.getMyOrganisation = getMyOrganisation;
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

module.exports.getAgentItems = getAgentItems;
module.exports.createAgent = createAgent;
module.exports.removeAgent = removeAgent;

module.exports.partnershipFeeds = partnershipFeeds;
module.exports.requestPartnership = requestPartnership;
module.exports.managePartnership = managePartnership;

module.exports.contractFeeds = contractFeeds;
module.exports.contractInfo = contractInfo;
module.exports.requestContract = requestContract;
module.exports.manageContract = manageContract;

module.exports.searchOrgs = searchOrgs;
module.exports.searchUsers = searchUsers;
module.exports.searchItems = searchItems;
