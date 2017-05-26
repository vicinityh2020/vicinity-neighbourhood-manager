var mongoose = require('mongoose');
var devOp = require('../../models/vicinityManager').devOpsVicinity;
var logger = require("../../middlewares/logger");


  function postOne(req, res, next) {
    var response = {};
    var us_id = mongoose.Types.ObjectId(req.body.userId);
    var co_id = mongoose.Types.ObjectId(req.body.companyId);
    var dbDev = new devOp();

      dbDev.sentByReg = us_id;
      dbDev.type = co_id;
      dbNotif.save(function(err,data){
        if(err){
          logger.debug("Error creating the dev user");
          response = {"error": true, "message": "Error fetching data"};
        } else {
          response = {"error": false, "message": data};
        }
      });

      logger.debug('Success creating devOps');
      res.json(response);
    }



  function getAll(req, res, next) {
    var response = {};

    devOp.find({}, function(err, data) {
      if (err) {
        response = {"error": true, "message": "Error fetching data"};
      } else {
        response = {"error": false, "message": data};
      }
      res.json(response);
    });
  }

module.exports.postOne = postOne;
module.exports.getAll = getAll;
