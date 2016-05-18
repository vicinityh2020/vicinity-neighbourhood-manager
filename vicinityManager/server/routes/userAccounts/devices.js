var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var winston = require('winston');

function getMyDevices(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);

  itemOp.find({hasAdministrator: { $in: [o_id]}}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });

}

function getNeighbourhood(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);


  userAccountOp.find({_id: o_id}, function(err, data){
    if (err){
      winston.log('error','UserAccount Items Error: ' + err.message);
    }
    if (data && data.length == 1){
      var query = {};

      if (req.query.hasAccess){
        if (req.query.hasAccess == '1') {
            winston.log('debug', 'hasAccess filter applied');
            query = {
              hasAdministrator: { $in: data[0].knows },
              $or : [{accessLevel: 4}, {accessLevel: 3}, {accessLevel: 2, hasAccess: {$in: [data[0]._id]}}]}
        } else if (req.query.hasAccess == '0') {
          winston.log('debug', 'hasAccess filter not applied');
          query = {
            hasAdministrator: { $in: data[0].knows },
            $or : [{accessLevel: 4}, {accessLevel: 3}, {accessLevel: 2}]}
        }
      } else {
        winston.log('debug', 'hasAccess filter not applied');
        query = {
          hasAdministrator: { $in: data[0].knows },
          $or : [{accessLevel: 4}, {accessLevel: 3}, {accessLevel: 2}]}
      }
      winston.log('debug', 'my friends are: ' + data[0].knows);
      itemOp.find(query)
        .populate('hasAdministrator','organisation')
            .exec(function(err, data) {

              if (err) {
                winston.log('error','Find Items Error: ' + err.message);
                response = {"error": true, "message": "Error fetching data"};
              } else {
                response = {"error": false, "message": data};
              }
              res.json(response);
            });
      }
    });

}


module.exports.getMyDevices = getMyDevices;
module.exports.getNeighbourhood = getNeighbourhood;
