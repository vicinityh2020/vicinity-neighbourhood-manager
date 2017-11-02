// Variables and global objects
var mongoose = require('mongoose');
var delUser = require('../../helpers/users/deleteUsers');
var userOp = require('../../models/vicinityManager').user;
var logger = require('../../middlewares/logger');

// Public functions
function deleteUser(req, res, next) {
  var o_id = [];
  o_id.push(mongoose.Types.ObjectId(req.params.id));
  delUser.deleteAllUsers(o_id)
  .then(
    function(response){
      logger.debug("Users deleted...");
      res.json({'status': 'success', 'message': response});
    }
  )
  .catch(
    function(err){
      res.json({'status': 'error', 'message': 'error...' + err});
    }
  );
}

// Export functions
module.exports.deleteUser = deleteUser;
