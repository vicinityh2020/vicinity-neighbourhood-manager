// Global variables and packages
var mongoose = require('mongoose');
var userOp = require('../../models/vicinityManager').user;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");

// Public functions
function getOne(req, res, next) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  userOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

function getAll(req, res, next) {
  var othercid = mongoose.Types.ObjectId(req.params.id);
  var mycid = mongoose.Types.ObjectId(req.query.mycid);
  var friends = [], users = [];
  
  userAccountOp.findById(othercid, {knows:1, accountOf:1}).populate('accountOf', 'avatar name email occupation location authentication status accessLevel')
  .then(function(response){
    friends = response.knows;
    users = response.accountOf;
    var relation = myRelationWithOther(mycid, othercid, friends);

    if(relation === 1){
      users = users.filter(function(i){return i.accessLevel >= 1;});
    } else if(relation === 2){
      users = users.filter(function(i){return i.accessLevel === 2;});
    } else {}

    res.json({"error": false, "message": users});
  })
  .catch(function(error){
      res.json({"error": true, "message": error});
  });
}

// Private functions

function myRelationWithOther(a,b,c){
  c = c.join();
  c = c.split(',');
  if(a.toString() === b.toString()){ return 0; } // Same company
  else if(c.indexOf(a.toString()) !== -1){ return 1; } // Friend company
  else { return 2; } // Other company
}

// Export functions
module.exports.getOne = getOne;
module.exports.getAll = getAll;
