
// Global objects

var mongoose = require('mongoose');
var logger = require("../../middlewares/logBuilder");
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var commServer = require('../../services/commServer/request');
var audits = require('../../services/audit/audit');

/*
Creates a node for an organisation
Creates relevant users and groups in commServer
Receives request from client
*/
function postOne(req, res, callback){
  var company_id = mongoose.Types.ObjectId(req.body.decoded_token.orgid);
  var noSystemIntegrator = req.body.decoded_token.roles.indexOf("system integrator") === -1;
  var cid = req.body.decoded_token.cid;
  var userMail = req.body.decoded_token.sub !== 'undefined' ? req.body.decoded_token.sub : "unknown";
  var userId = req.body.decoded_token.uid !== 'undefined' ? req.body.decoded_token.uid : "unknown";
  var raw = req.body;

  var password = raw.pass || raw.password;
  var db = new nodeOp();
  db.name = raw.name;
  db.eventUri = raw.eventUri || "NA";
  db.agent = raw.agent || "NA";
  var newType = raw.type === "vicinity" ? "generic.adapter.vicinity.eu" : "generic.adapter.sharq.eu";
  db.type = raw.type === "generic.adapter.vicinity.eu" ? "generic.adapter.vicinity.eu" : newType;
  db.status = "active";
  db.cid = {"id": company_id, "extid": cid};
  db.adid = uuid();

  if(!password || !raw.name){
    res.status(400);
    logger.log(req, res, {type: 'warn', data: 'Agent not created, fields missing'});
    callback(false, 'Agent not created, fields missing...', false);
  } else if(noSystemIntegrator){
    res.status(403);
    logger.log(req, res, {type: 'warn', data: 'System integrator role missing'});
    callback(false, 'Agent not created, roles missing...', false);
  } else {
    db.save()
    .then(function(data){
      var payload = { username : data.adid, name: data.name, password: password
        // properties: { property: [ {'@key':'agent', '@value': data.agent}, {'@key':'uri', '@value': data.eventUri} ]}
      };
      var groupData = { name: data.adid, description: data.name };
      commServer.callCommServer(payload, 'users', 'POST')
      .then( function(response){ return commServer.callCommServer({}, 'users/' + data.adid + '/groups/' + cid + '_agents', 'POST'); })  //Add node to company group in commServer
      .then( function(response){ return commServer.callCommServer(groupData, 'groups/', 'POST'); }) // Create node group in commServer
      .then( function(response){ return userAccountOp.update( { _id: company_id}, {$push: {hasNodes: {"id": data._id, "extid": data.adid}}}); }) // Add node to company in MONGO
      .then( function(response){
        return audits.create(
          { kind: 'user', item: userId, extid: userMail },
          { kind: 'userAccount', item: company_id, extid: cid },
          { kind: 'node', item: data._id, extid: data.adid },
          21, null);
        })
      .then(function(response){
        logger.log(req, res, {type: 'audit', data: {user: userMail, action: 'createNode', item: data._id }});
        callback(false, {adid: db.adid, id: db._id, type: db.type}, true);
        })
        .catch(function(err){
          callback(true, err, false);
        });
      })
      .catch(function(err){
        callback(true, err, false);
      });
    }
  }

// Export Functions

module.exports.postOne = postOne;
