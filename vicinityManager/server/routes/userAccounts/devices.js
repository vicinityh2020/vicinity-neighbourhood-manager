var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var winston = require('winston');

function getMyDevices(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var query = {};

  var s = req.query.sort;

  query = {hasAdministrator: o_id};

  itemOp.find(query).populate('hasAdministrator','organisation').exec(function(err, data){
    sortResult(data,s);
    var dataWithAdditional = getAdditional(data,o_id);


    if (err) {
      winston.log('error','Find Items Error: ' + err.message);
      response =  {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": dataWithAdditional};
    };

    res.json(response);
  });
}

function sortResult(data,s) {
  if (s === "ASC") {
      data.sort(sortListOfDevicesASC);
  } else if (s === "DESC") {
      data.sort(sortListOfDevicesDESC);
  };
}



function getNeighbourhood(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  var query = {};

  userAccountOp.find({_id: o_id}, function(err, data){
    if (err){
      winston.log('error','UserAccount Items Error: ' + err.message);
    }
    if (data && data.length == 1){

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

      }

      itemOp.find(query).populate('hasAdministrator','organisation').exec(function(err, data){
        // sortResult(data,s);
        var dataWithAdditional = getAdditional(data,o_id);

        if (err) {
          winston.log('error','Find Items Error: ' + err.message);
          response =  {"error": true, "message": "Error fetching data"};
        } else {
          response = {"error": false, "message": dataWithAdditional};
        };

        res.json(response);
      });
    });



}

function getAdditional(data,activeCompany_id){

    winston.log('debug','enter function getAdditional');

          // var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.context.cid);
          var device = {};
          var plain_data = [];
          var deviceWithAdd = {};

          for (index in data){
            var isOwner = false;
            var canAnswer = false;
            var isPrivate = false;
            var isPublic = false;
            var isMeta = false;
            var isFriendData = false;
            var cancelAccess2 = false;
            var cancelRequest2 = false;
            var interruptConnection2 = false;
            var isMetaCanReq = -5;
            var isMetaNotReq = -5;
            var isMetaInter = -5;
            device = data[index];

            if (activeCompany_id.toString() === device.hasAdministrator[0]._id.toString()){
              isOwner = true;
            } else {
              isOwner = false;
            };

            if (device.accessRequestFrom.length > 0 && isOwner==true){
              canAnswer = true;
            };

            if (isOwner==false && device.accessLevel==1){
              isPrivate = true;
            };

            if (isOwner==false && device.accessLevel==2){
              isMeta = true;
            };

            a=0;
            for (index1 in device.accessRequestFrom){
              if (device.accessRequestFrom[index1].toString() === activeCompany_id.toString()){
                a++;
              }
            };

            c=0;
            for (index2 in device.hasAccess){
              if (device.hasAccess[index2].toString() === activeCompany_id.toString()){
                c++;
              }
            };

             if (isMeta==true && (a+c)==0){
              cancelRequest2=false;
            };

             if (isMeta==true && a>0){
              cancelRequest2=true;
            };

             if (isMeta==true && c>0){
              interruptConnection2=true;
            };


            if (isOwner==false && device.accessLevel==3){
              isFriendData = true;
            };

            b=0;

            for (index in device.hasAccess){
              if (device.hasAccess[index].toString() === activeCompany_id.toString()){
                b++;
              }
            };

             if (isFriendData==true && b>0){
              cancelAccess2=true;
            };
             if (isFriendData==true && b==0){
               cancelAccess2=false;
             };

            if (isOwner==false && device.accessLevel==4){
              isPublic = true;
            };

            if (isMeta && cancelRequest2){
              isMetaCanReq = 100;
              isMetaNotReq = -5;
              isMetaInter = -5;
            };

            if (isMeta && !cancelRequest2 && !interruptConnection2){
              isMetaCanReq = -5;
              isMetaInter = -5;
              isMetaNotReq = 100;
            };

            if (isMeta && interruptConnection2){
              isMetaCanReq = -5;
              isMetaInter = 100;
              isMetaNotReq = -5;
            };

            deviceWithAdd = device.toObject();
            deviceWithAdd.isOwner = isOwner;
            deviceWithAdd.canAnswer = canAnswer;
            deviceWithAdd.isPrivate = isPrivate;
            deviceWithAdd.isMeta = isMeta;
            deviceWithAdd.isFriendData = isFriendData;
            deviceWithAdd.isPublic = isPublic;
            deviceWithAdd.cancelAccess2 = cancelAccess2;
            deviceWithAdd.cancelRequest2 = cancelRequest2;
            deviceWithAdd.interruptConnection2 = interruptConnection2;

            deviceWithAdd.isMetaCanReq = isMetaCanReq;
            deviceWithAdd.isMetaInter = isMetaInter;
            deviceWithAdd.isMetaNotReq = isMetaNotReq;

            plain_data.push(deviceWithAdd);

          };

          winston.log('debug','exit getAdditional');

          // res.json(response);     //??
          return plain_data;
}

function sortListOfDevicesASC(a,b){
  if (a.accessLevel == 3) {
    return -1;
  } else if (a.accessLevel == 4){
    return 1;
} else {
    return 0;
  }
}

function sortListOfDevicesDESC(a,b){
  if (a.accessLevel < b.accessLevel) {
    return 1;
  } else if (a.accessLevel > b.accessLevel){
    return -1;
  } else {
    return 0;
  }
}

module.exports.getMyDevices = getMyDevices;
module.exports.getNeighbourhood = getNeighbourhood;
