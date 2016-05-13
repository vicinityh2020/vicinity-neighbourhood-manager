module.exports.getOne = getOne;
module.exports.getAll = getAll;
module.exports.getItemWithAdd = getItemWithAdd;

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
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
  })
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
    var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.context.cid);
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

    itemOp.find({_id: dev_id}, function (err, data) {
      if (err || data === null) {
          response = {"error": true, "message": "Processing data failed!"};
      } else {
          if (data.length == 1) {

              var device = data[0];

              if (activeCompany_id.toString() === device.hasAdministrator.toString()){
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

              plain_data = device.toObject();
              plain_data.isOwner = isOwner;
              plain_data.canAnswer = canAnswer;
              plain_data.isPrivate = isPrivate;
              plain_data.isMeta = isMeta;
              plain_data.isFriendData = isFriendData;
              plain_data.isPublic = isPublic;
              plain_data.cancelAccess2 = cancelAccess2;
              plain_data.cancelRequest2 = cancelRequest2;
              plain_data.interruptConnection2 = interruptConnection2;

              response = {"error": false, "message": plain_data};

              // device.save();

        } else {
              response = {"error": true, "message": "Processing data failed!"};
          }
        }
      winston.log('debug','End: getItemWithAdd');
      res.json(response);
    });

}
