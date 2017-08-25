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
            var isPublic = (isOwner === false && device.accessLevel === 8);
            var isUnderRequest = false;
            var isFriendData = false;
            var isPrivate = false;
            var cancelRequest = false;
            var interruptConnection = false;

            var i = 0;

            var haveAccess = 0;
            for (i = 0; i < device.hasAccess.length; i++){
              if(device.hasAccess[i]){
                if (device.hasAccess[i].toString() === activeCompanyStr){
                  haveAccess++;
                }
              }
            }

            var haveRequested = 0;
            for (i = 0; i < device.accessRequestFrom.length; i++){
              if(device.accessRequestFrom[i]){
                if (device.accessRequestFrom[i].toString() === activeCompanyStr){
                  haveRequested++;
                }
              }
            }

            var imFriend = false;
            for (i = 0; i < friends.length; i++){
                if (friends[i].toString() === device.hasAdministrator[0]._id.toString()){
                  imFriend = true;
                }
            }

            isUnderRequest = (isOwner === false && (device.accessLevel === 3 || device.accessLevel === 6));
            isFriendData = (device.accessLevel === 4 || device.accessLevel === 7);
            isPrivate = (isOwner === false && (device.accessLevel === 2 || device.accessLevel === 5));
            cancelRequest = (isUnderRequest && haveRequested && !haveAccess);
            interruptConnection = (isUnderRequest && haveAccess);
            seeData = (isOwner || haveAccess > 0 || isPublic || (isFriendData && imFriend));

            var accessLevelCaption = giveMeCaption(device.accessLevel);

            deviceWithAdd = device.toObject();
            deviceWithAdd.isOwner = isOwner;
            deviceWithAdd.isPrivate = isPrivate;
            deviceWithAdd.isFriendData = (isFriendData === true && isOwner === false);
            deviceWithAdd.isPublic = isPublic;
            deviceWithAdd.isUnderRequest = isUnderRequest;
            deviceWithAdd.imFriend = (imFriend === true && isOwner === false);
            deviceWithAdd.myFriends = friends;
            logger.debug(friends);
            deviceWithAdd.accessLevelCaption = accessLevelCaption;
            deviceWithAdd.cancelRequest = cancelRequest;
            deviceWithAdd.interruptConnection = interruptConnection;
            deviceWithAdd.seeData = seeData;

            plain_data.push(deviceWithAdd);
          }

          return plain_data;
}

function giveMeCaption(n){
  switch (n) {
      case 1:
          caption = "Private";
          break;
      case 2:
          caption = "Metadata Only";
          break;
      case 3:
          caption = "Data Under Request";
          break;
      case 4:
          caption = "Data Shared With Partners";
          break;
      case 5:
          caption = "Public Metadata Only";
          break;
      case 6:
          caption = "Public Data Under Request";
          break;
      case 7:
          caption = "Public Data Shared With Partners";
          break;
      case 8:
          caption = "Public";
  }
  return caption;
}

module.exports.getAdditional = getAdditional;
