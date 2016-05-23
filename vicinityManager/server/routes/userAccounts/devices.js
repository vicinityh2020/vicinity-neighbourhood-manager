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

              var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.context.cid);
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
                  if (device.accessRequestFrom[index1].toString()===activeCompany_id.toString()){
                    a++;
                  }
                };
                c=0;
                for (index2 in device.hasAccess){
                  if (device.hasAccess[index2].toString()===activeCompany_id.toString()){
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
                  if (device.hasAccess[index].toString()===activeCompany_id.toString()){
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

                // plain_data[index] = device.toObject();
                // plain_data[index].isOwner = isOwner;
                // plain_data[index].canAnswer = canAnswer;
                // plain_data[index].isPrivate = isPrivate;
                // plain_data[index].isMeta = isMeta;
                // plain_data[index].isFriendData = isFriendData;
                // plain_data[index].isPublic = isPublic;
                // plain_data[index].cancelAccess2 = cancelAccess2;
                // plain_data[index].cancelRequest2 = cancelRequest2;
                // plain_data[index].interruptConnection2 = interruptConnection2;
              }

              if (err) {
                winston.log('error','Find Items Error: ' + err.message);
                response = {"error": true, "message": "Error fetching data"};
              } else {
                response = {"error": false, "message": plain_data};
              }
              res.json(response);
            });
      }
    });

}


module.exports.getMyDevices = getMyDevices;
module.exports.getNeighbourhood = getNeighbourhood;
