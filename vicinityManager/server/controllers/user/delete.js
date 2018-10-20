// Variables and global objects
var mongoose = require('mongoose');
var delUser = require('../../services/users/deleteUsers');
var userOp = require('../../models/vicinityManager').user;
var logger = require('../../middlewares/logBuilder');

// Public functions
function deleteUser(req, res, next) {
  var uid = [];
  uid.push(mongoose.Types.ObjectId(req.params.id));
  delUser.deleteAllUsers(uid, req, res)
  .then(
    function(response){
      res.json(response);
    }
  )
  .catch(
    function(err){
      // logger.log(req, res, {type: "error", data: err});
      res.json({'status': 'error', 'message': err});
    }
  );
}

// Export functions
module.exports.deleteUser = deleteUser;
