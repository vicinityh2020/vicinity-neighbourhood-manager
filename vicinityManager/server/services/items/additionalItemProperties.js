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
  var obj = {}; // return object

  friends = friends != null ? friends : [];

  try{

    for ( var index = 0; index < data.length; index++){

      device = data[index];
      var isOwner = (activeCompanyStr === device.cid.id._id.toString());
      var isPublic = (device.accessLevel === 2);
      var isFriendData = (device.accessLevel === 1);
      var isPrivate = (device.accessLevel === 0);

      var imFriend = false;
      for (var i = 0, ll = friends.length; i < ll; i++){
          if (friends[i].toString() === device.cid.id._id.toString()){
            imFriend = true;
          }
      }

      var isContracted = false;
      for (var j = 0, lll = device.hasContracts.length; j < lll; j++){
          if (device.hasContracts[j].contractingParty.toString() === activeCompanyStr){
            isContracted = true;
          }
      }

      var accessLevelCaption = giveMeCaption(device.accessLevel);
      deviceWithAdd = device;
      deviceWithAdd.isOwner = isOwner;
      deviceWithAdd.isPrivate = isPrivate;
      deviceWithAdd.isFriendData = isFriendData;
      deviceWithAdd.isPublic = isPublic;
      deviceWithAdd.imFriend = (imFriend === true && isOwner === false);
      deviceWithAdd.myFriends = friends;
      deviceWithAdd.accessLevelCaption = accessLevelCaption;
      deviceWithAdd.isContracted = isContracted;

      plain_data.push(deviceWithAdd);
    }
    obj.error = false;
    obj.items = plain_data;
    return obj;
  } catch(err) {
    obj.error = true;
    obj.message = err;
    return obj;  }
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
