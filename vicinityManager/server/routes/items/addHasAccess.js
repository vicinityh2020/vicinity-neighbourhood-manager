// TODO Delete if not necessary

// var mongoose = require('mongoose');
//
// var itemOp = require('../../models/vicinityManager').item;
//
// function addFriendToHasAccess(req, res, next){
//     console.log("Getting back access (renewing of access data)!");
//     friend_id = mongoose.Types.ObjectId(req.params.id);
//     activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//     var device = {};
//     var response = {};
//
//     itemOp.find({hasAdministrator: activeCompany_id, accessLevel: 3}, function (err, data) {
//
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//
//                 for (index in data){
//                   device=data[index];
//                   device.hasAccess.push(friend_id);
//                 }
//
//                 device.save();
//                 response = {"error": false, "message": "Processing data success!"};
//
//         }
//
//         res.json(response);
//     });
// }
// module.exports.addFriendToHasAccess = addFriendToHasAccess;
