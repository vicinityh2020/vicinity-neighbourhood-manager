// Variables and global objects
var mongoose = require('mongoose');
var delUser = require('../../services/users/deleteUsers');
var userOp = require('../../models/vicinityManager').user;
var logger = require('../../middlewares/logger');

// Public functions
function deleteUser(req, res, next) {
  var uid = [];
  var email = req.body.decoded_token.sub;
  uid.push(mongoose.Types.ObjectId(req.params.id));
  delUser.deleteAllUsers(uid, email)
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
