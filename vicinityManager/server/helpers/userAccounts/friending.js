// TODO Delete if not requried !!!!!!!!!!!




// var mongoose = require('mongoose');
// var logger = require("../../middlewares/logger");
// var userAccountOp = require('../../models/vicinityManager').userAccount;
// var notificationOp = require('../../models/vicinityManager').notification;
// var notificationAPI = require('../../routes/notifications/notifications');
//
//
// //TODO: Issue #6  check that only :id can make friends.
// //TODO: Issue #6 Send friendship notification to :id.
// //TODO: Issue #6 check double requests;
// //TODO: Issue #6 check transactions;
//
// function processFriendRequest(req, res, next) {
//     console.log("POST /:id/friendship");
//     console.log(":id " + req.params.id);
//     friend_id = mongoose.Types.ObjectId(req.params.id);
//     my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//     var friend = {};
//     var me = {};
//     var response = {};
//     userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//             if (data.length == 2) {
//
//                 var me = {};
//                 var friend = {};
//                 for (var index in data) {
//                     if (data[index]._id.toString() === friend_id.toString()) {
//                         friend = data[index];
//                     } else {
//                         me = data[index];
//                     }
//                 }
//
//                 friend.knowsRequestsFrom.push(my_id);
//                 me.knowsRequestsTo.push(friend_id);
//
//                 var notification = new notificationOp();
//
//                 notification.addressedTo.push(friend._id);
//                 notification.sentBy = me._id;
//                 notification.type = 'friendRequest';
//                 notification.isUnread = true;
//                 notification.save();
//
//                 friend.hasNotifications.push(notification._id);
//
//                 friend.save();
//                 me.save();
//                 response = {"error": false, "message": "Processing data success!"};
//             } else {
//                 response = {"error": true, "message": "Processing data failed!"};
//             }
//         }
//         res.json(response);
//     });
// }
//
// function acceptFriendRequest(req, res, next) {
//     //TODO: Issue #6 :id should have authenticated user as in request list.
//     //TODO: Issue #6 update knows list on :id and authenticated user side.
//     //TODO: Issue #6 create new friendship story.
//     //TODO: Issue #6 update friendship counts.
//     logger.debug("Running accept friend request");
//     var friend_id = mongoose.Types.ObjectId(req.params.id);
//     var my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//
//     userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
//         var index;
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//             if (data.length == 2) {
//                 var me = {};
//                 var friend = {};
//                 for (index in data) {
//                     if (data[index]._id.toString() === friend_id.toString()) {
//                         friend = data[index];
//                     } else {
//                         me = data[index];
//                     }
//                 }
//
//                 friend.knows.push(my_id);
//                 me.knows.push(friend_id);
//
//                 for (index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
//                     if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
//                         friend.knowsRequestsTo.splice(index, 1);
//                     }
//                 }
//
//                 for (index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
//                     if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
//                         me.knowsRequestsFrom.splice(index,1);
//                     }
//                 }
//
//                 notificationAPI.markAsRead(friend_id, my_id, "friendRequest");
//
//                 friend.save();
//                 me.save();
//                 response = {"error": false, "message": "Processing data success!"};
//             } else {
//                 response = {"error": true, "message": "Processing data failed!"};
//             }
//         }
//
//         res.json(response);
//     });
// }
//
// function rejectFriendRequest(req, res, next) {
//     //TODO: Issue #6 remove :id from authenitcated user knows list
//     //TODO: Issue #6 remove :autenticated user from :id's knows list
//     //TODO: Issue #6 update friendship counts.
//     console.log("Running reject friend request");
//     friend_id = mongoose.Types.ObjectId(req.params.id);
//     my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//
//     userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
//         var index;
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//             if (data.length == 2) {
//                 var me = {};
//                 var friend = {};
//                 for (index in data) {
//                     if (data[index]._id.toString() === friend_id.toString()) {
//                         friend = data[index];
//                     } else {
//                         me = data[index];
//                     }
//                 }
//
//                 for (index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
//                     if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
//                         friend.knowsRequestsTo.splice(index, 1);
//                     }
//                 }
//
//                 for (index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
//                     if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
//                         me.knowsRequestsFrom.splice(index,1);
//                     }
//                 }
//
//                 notificationAPI.markAsRead(friend_id, my_id, "friendRequest");
//
//                 friend.save();
//                 me.save();
//                 response = {"error": false, "message": "Processing data success!"};
//             } else {
//                 response = {"error": true, "message": "Processing data failed!"};
//             }
//         }
//
//         res.json(response);
//     });
// }
//
// function cancelFriendRequest(req, res, next){
//     console.log("Running cancelation of friend request!");
//     friend_id = mongoose.Types.ObjectId(req.params.id);
//     my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//
//     userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
//         var index;
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//             if (data.length == 2) {
//                 var me = {};
//                 var friend = {};
//                 for (index in data) {
//                     if (data[index]._id.toString() === friend_id.toString()) {
//                         friend = data[index];
//                     } else {
//                         me = data[index];
//                     }
//                 }
//
//                 for (index = friend.knowsRequestsFrom.length - 1; index >= 0; index --) {
//                     if (friend.knowsRequestsFrom[index].toString() === my_id.toString()) {
//                         friend.knowsRequestsFrom.splice(index, 1);
//                     }
//                 }
//
//                 for (index = me.knowsRequestsTo.length - 1; index >= 0; index --) {
//                     if (me.knowsRequestsTo[index].toString() === friend_id.toString()) {
//                         me.knowsRequestsTo.splice(index,1);
//                     }
//                 }
//
//                 notificationAPI.markAsRead(my_id, friend_id, "friendRequest");
//
//                 friend.save();
//                 me.save();
//                 response = {"error": false, "message": "Processing data success!"};
//             } else {
//                 response = {"error": true, "message": "Processing data failed!"};
//             }
//         }
//
//         res.json(response);
//     });
// }
//
//
// function cancelFriendship(req, res, next){
//     console.log("Running cancelation of friendship!");
//     friend_id = mongoose.Types.ObjectId(req.params.id);
//     my_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
//
//     userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
//         var index;
//         if (err || data === null) {
//             response = {"error": true, "message": "Processing data failed!"};
//         } else {
//             if (data.length == 2) {
//                 var me = {};
//                 var friend = {};
//                 for (index in data) {
//                     if (data[index]._id.toString() === friend_id.toString()) {
//                         friend = data[index];
//                     } else {
//                         me = data[index];
//                     }
//                 }
//
//                 for (index = friend.knows.length - 1; index >= 0; index --) {
//                     if (friend.knows[index].toString() === my_id.toString()) {
//                         friend.knows.splice(index, 1);
//                     }
//                 }
//
//                 for (index = me.knows.length - 1; index >= 0; index --) {
//                     if (me.knows[index].toString() === friend_id.toString()) {
//                         me.knows.splice(index,1);
//                     }
//                 }
//
//                 friend.save();
//                 me.save();
//                 response = {"error": false, "message": "Processing data success!"};
//             } else {
//                 response = {"error": true, "message": "Processing data failed!"};
//             }
//         }
//
//         res.json(response);
//     });
// }
//
// function findFriends(req, res, next){
//   logger.debug("GET /:id/friends");
//   logger.debug(":id " + req.params.id);
//
//   var response = {};
//   var o_id = mongoose.Types.ObjectId(req.params.id);
//
//   userAccountOp.findById(o_id).
//     populate('knows').exec(function(err, data){
//
//     if (req.query.sort){
//       if (req.query.sort == 'ASC') {
//           data.knows.sort(sortListOfFriendsASC);
//       } else if (req.query.sort == 'DESC') {
//           data.knows.sort(sortListOfFriendsDESC);
//       }
//     }
//
//     if (err) {
//       response = {"error": true, "message": "Error fetching data"};
//     } else {
//       response = {"error": false, "message": data.knows};
//     }
//
//     res.json(response);
//
//     }
//   );
// }
//
//   function sortListOfFriendsASC(a,b){
//     if (a.organisation < b.organisation) {
//       return -1;
//     } else if (a.organisation > b.organisation){
//       return 1;
//     } else {
//       return 0;
//     }
//   }
//
//   function sortListOfFriendsDESC(a,b){
//     if (a.organisation < b.organisation) {
//       return 1;
//     } else if (a.organisation > b.organisation){
//       return -1;
//     } else {
//       return 0;
//     }
//   }
//
// module.exports.processFriendRequest = processFriendRequest;
// module.exports.acceptFriendRequest = acceptFriendRequest;
// module.exports.rejectFriendRequest = rejectFriendRequest;
// module.exports.cancelFriendRequest = cancelFriendRequest;
// module.exports.cancelFriendship = cancelFriendship;
// module.exports.findFriends = findFriends;
