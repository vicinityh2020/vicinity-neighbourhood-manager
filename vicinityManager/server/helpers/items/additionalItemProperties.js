var logger = require("../../middlewares/logger");
/*
For each item in array -->  Adds useful info to be used in client side
Complements each item object with new fields
Client --> Views/ MyDevices && AllDevices
*/
function getAdditional(data,activeCompany_id,friends){
          var activeCompanyStr = activeCompany_id.toString();
          var device = {};
          var plain_data = [];
          var deviceWithAdd = {};
          var index;

          for (index = 0; index < data.length; index++){

            device = data[index];

            var isOwner = (activeCompanyStr === device.hasAdministrator[0]._id.toString());
            var isPublic = (isOwner === false && device.accessLevel === 2);
            var isFriendData = (isOwner === false && device.accessLevel === 1);
            var isPrivate = (isOwner === false && device.accessLevel === 0);

            var i = 0;

            var imFriend = false;
            for (i = 0; i < friends.length; i++){
                if (friends[i].toString() === device.hasAdministrator[0]._id.toString()){
                  imFriend = true;
                }
            }

            var accessLevelCaption = giveMeCaption(device.accessLevel);

            deviceWithAdd = device.toObject();
            deviceWithAdd.isOwner = isOwner;
            deviceWithAdd.isPrivate = isPrivate;
            deviceWithAdd.isFriendData = isFriendData;
            deviceWithAdd.isPublic = isPublic;
            deviceWithAdd.imFriend = (imFriend === true && isOwner === false);
            deviceWithAdd.myFriends = friends;
            deviceWithAdd.accessLevelCaption = accessLevelCaption;

            plain_data.push(deviceWithAdd);
          }

          return plain_data;
}

function giveMeCaption(n){
  switch (n) {
      case 0:
          caption = "Private";
          break;
      case 1:
          caption = "Data Under Request for friends";
          break;
      case 2:
          caption = "Data Under Request for everyone";
          break;
      default:
          caption = "Private";
  }
  return caption;
}

module.exports.getAdditional = getAdditional;
