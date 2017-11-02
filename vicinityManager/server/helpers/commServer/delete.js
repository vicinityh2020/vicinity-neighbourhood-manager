// Global Objects

var mongoose = require('mongoose');
var nodeOp = require('../../models/vicinityManager').node;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require('../../middlewares/logger');
var myItems = require('../../helpers/items/deleteItems');
var myNode = require('../../helpers/nodes/processNode');

// Public functions
/*
Removes all received oids from commServer and MONGO
*/
function deleteItems(req, res, next){
  var oids = req.body.oids;
  myItems.deleteItems(oids)
  .then(function(response){res.json({"error": false, "message": response});})
  .catch(function(err){res.json({"error": true, "message": err});});
}

/*
Removes node and all oids under it
*/
function deleteAgent(req, res, next){
  var adid = req.params.adid;
  nodeOp.findOne({adid: adid}, function(err, data){
    if(err || !data){
      res.json({"error": true, "message": "Something went wrong: " + err});
    } else {
      var cid = data.organisation;
      userAccountOp.update({_id: cid}, {$pull: {hasNodes: adid}}, function(err, data){
        if(!err){
          var adids = [];
          adids.push(adid);
          myNode.deleteNode(adids)
          .then(function(response){res.json({"error": false, "message": response});})
          .catch(function(err){res.json({"error": true, "message": err});});
        }
      });
    }
  });
}

// Export Functions

module.exports.deleteItems = deleteItems;
module.exports.deleteAgent = deleteAgent;
