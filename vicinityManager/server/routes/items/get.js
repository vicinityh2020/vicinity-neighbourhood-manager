module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getItemWithAdd = getItemWithAdd;

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var winston = require('winston');

winston.level='debug';

function getOne(req, res, next) {
//TODO: User authentic - Role check
  winston.log('debug','Start getOne');
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.id);
  itemOp.findById(o_id, function(err, data){
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    winston.log('debug','End getOne');
    res.json(response);
  });
}

function getAll(req, res, next) {
//TODO: User authentic - Role check
  var response = {};

  itemOp.find({}, function(err, data) {
    if (err) {
      response = {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": data};
    }
    res.json(response);
  });
}

function getItemWithAdd(req, res, next) {
    winston.log('debug','Start: getItemWithAdd');
    var response = {};

    var o_id = mongoose.Types.ObjectId(req.params.id);          //dev_id

    var isNeighbour = false;
    var canSendNeighbourRequest = true;
    var canCancelNeighbourRequest = false;
    var canAnswerNeighbourRequest = false;
    //TODO: Issue #6 Update userAcount profile wheather the autenticated user is friend with :id
    //TODO: Remove foreing users;

    var dev_id = mongoose.Types.ObjectId(req.params.id);
    var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    var device = {};
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

    itemOp.find({_id: dev_id}).populate('hasAdministrator','organisation')
        .exec(function(err, data){

      if (err || data === null) {
          response = {"error": true, "message": "Processing data failed!"};
      } else {
          if (data.length == 1) {
              var device = data[0];
              var activeCompanyStr = activeCompany_id.toString();

              if (activeCompanyStr === device.hasAdministrator[0]._id.toString()){
                isOwner = true;
              } else {
                isOwner = false;
              }

              if (device.accessRequestFrom.length > 0 && isOwner===true){
                canAnswer = true;
              }

              if (isOwner===false && device.accessLevel===1){
                isPrivate = true;
              }

              if (isOwner===false && device.accessLevel===2){
                isMeta = true;
              }

            var index1;
            var a = 0;
            for (index1 = 0; index1 < device.accessRequestFrom.length; index1++){
              if (device.accessRequestFrom[index1].toString() === activeCompanyStr){
                a++;
              }
            }

  //TODO POSSIBLE ERROR HERE, CHECK IMPORTANT
              var index2;
              var c = 0;
              for (index2 = 0; index2 < device.hasAccess.length; index2++){
                if(device.hasAccess[index2]){
                  if (device.hasAccess[index2].toString() === activeCompanyStr){
                    c++;
                  }
                }
              }


               if (isMeta===true && (a+c)===0){
                cancelRequest2=false;
              }

               if (isMeta===true && a>0){
                cancelRequest2=true;
              }

               if (isMeta===true && c>0){
                interruptConnection2=true;
              }


              if (isOwner===false && device.accessLevel===3){
                isFriendData = true;
              }

  //TODO POSSIBLE ERROR HERE, CHECK IMPORTANT
              var index3;
              var b = 0;

              for (index3 = 0; index3 < device.hasAccess.length; index3++){
                if(device.hasAccess[index3]){
                  if (device.hasAccess[index3].toString() === activeCompanyStr){
                    b++;
                  }
                }
              }

               if (isFriendData===true && b>0){
                cancelAccess2=true;
              }

               if (isFriendData===true && b===0){
                 cancelAccess2=false;
               }

              if (isOwner===false && device.accessLevel==4){
                isPublic = true;
              }

              if (isMeta && cancelRequest2){
                isMetaCanReq = 100;
                isMetaNotReq = -5;
                isMetaInter = -5;
              }

              if (isMeta && !cancelRequest2 && !interruptConnection2){
                isMetaCanReq = -5;
                isMetaInter = -5;
                isMetaNotReq = 100;
              }

              if (isMeta && interruptConnection2){
                isMetaCanReq = -5;
                isMetaInter = 100;
                isMetaNotReq = -5;
              }


              // var company = {};
              var plain_data = {};
              // var comp_id = device.hasAdministrator[0];

              // if (device.hasAdministrator.length >=1){
              //   userAccountOp.find({_id: comp_id}, function (err, data2) {
              //       company = data2;
              //   });
              // };

              plain_data = device.toObject();
              plain_data.isOwner = isOwner;

              // plain_data.organisation = company.organisation;

              plain_data.canAnswer = canAnswer;
              plain_data.isPrivate = isPrivate;
              plain_data.isMeta = isMeta;
              plain_data.isFriendData = isFriendData;
              plain_data.isPublic = isPublic;
              plain_data.cancelAccess2 = cancelAccess2;
              plain_data.cancelRequest2 = cancelRequest2;
              plain_data.interruptConnection2 = interruptConnection2;

              plain_data.isMetaCanReq = isMetaCanReq;
              plain_data.isMetaNotReq = isMetaNotReq;
              plain_data.isMetaInter = isMetaInter;


              response = {"error": false, "message": plain_data};


        } else {
              response = {"error": true, "message": "Processing data failed!"};
          }
        }
      winston.log('debug','End: getItemWithAdd');
      res.json(response);
    });

}
