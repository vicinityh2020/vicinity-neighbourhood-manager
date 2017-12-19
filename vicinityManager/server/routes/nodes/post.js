
// Global objects

var mongoose = require('mongoose');
var uuid = require('uuid/v4'); // Unique ID RFC4122 generator
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var commServer = require('../../helpers/commServer/request');
var audits = require('../../routes/audit/put');

// Functions

/*
Creates a node for an organisation
Creates relevant users and groups in commServer
Receives request from client
*/
function postOne(req, res, next) {
  var db = new nodeOp();
  var cid = req.body.cid;
  var company_id = mongoose.Types.ObjectId(req.params.id);
  db.name = req.body.name;
  db.eventUri = req.body.eventUri;
  db.agent = req.body.agent;
  db.type = req.body.type;
  db.status = "active";
  db.organisation = company_id;
  db.adid = uuid();

  db.save()
  .then(function(data){
    var payload = { username : data.adid, name: data.name, password: req.body.pass
      // properties: { property: [ {'@key':'agent', '@value': data.agent}, {'@key':'uri', '@value': data.eventUri} ]}
    };
    var groupData = { name: data.adid, description: data.name };
    commServer.callCommServer(payload, 'users', 'POST')
    .then( function(response){ return commServer.callCommServer({}, 'users/' + data.adid + '/groups/' + cid + '_agents', 'POST'); })  //Add node to company group in commServer
    .then( function(response){ return commServer.callCommServer(groupData, 'groups/', 'POST'); }) // Create node group in commServer
    .then( function(response){ return userAccountOp.update( { _id: company_id}, {$push: {hasNodes: data.adid}}); }) // Add node to company in MONGO
    .then( function(response){
      return audits.putAuditInt(
        data.organisation,
        { orgOrigin: data.organisation,
          user: req.body.userMail,
          auxConnection: {kind: 'node', item: data._id},
          eventType: 21 }
        );
      })
    .then(function(response){
      logger.audit({user: req.body.userMail, action: 'createNode', item: data._id });
      res.json({error: 'false', message: 'Node created!'}); })
    .catch(function(err){
      logger.warn({user: req.body.userMail, action: 'createNode', message: err});
      res.json({error: 'true', message: err });
    });
  })
  .catch(function(err){
    logger.error({user: req.body.userMail, action: 'createNode', message: err});
    res.json({error: 'true', message: err});
  });
}

// Export Functions

module.exports.postOne = postOne;
