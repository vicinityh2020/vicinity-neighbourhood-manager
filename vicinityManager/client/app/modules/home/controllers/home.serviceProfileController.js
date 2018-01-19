'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('serviceProfileController',
function ($scope, $window, $state, $stateParams, $location, tokenDecoder, commonHelpers, itemsAPIService, Notification) {

  $scope.locationPrefix = $location.path();
  // console.log("location:" + $location.path());

// Initialize variables and data =====================
// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.devEnabled = false;
  $scope.showInput = false;
  $scope.isMyItem = false;
  $scope.loaded = false;
  $scope.canSeeData = false;
  $scope.item = {};
  $scope.devInfo = {};
  $scope.AL = 0;
  $scope.imServiceProvider = false;

  initData();

  function initData(){
    itemsAPIService.getItemWithAdd($stateParams.serviceId)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );
      var payload = tokenDecoder.deToken();
      for(var i in payload.roles){
        if(payload.roles[i] === 'service provider'){
          $scope.imServiceProvider = true;
        }
      }
    }

    function updateScopeAttributes(response){
        $scope.item = response.data.message[0];
        $scope.devInfo = $scope.item.info;
        $scope.owner = $scope.item.cid.id.name;
        $scope.owner_id = $scope.item.cid.id._id;
        $scope.cid = $scope.item.cid;
        $scope.AL = $scope.item.accessLevel;
        $scope.devEnabled = ($scope.item.status === 'enabled');
        $scope.canSeeData = $scope.item.seeData;

        var aux = ["Private", "Partners with Data Under Request", "Public with Data Under Request"];
        $scope.ALcaption = aux[$scope.AL];

        $scope.isMyItem = ($window.sessionStorage.companyAccountId.toString() === $scope.owner_id.toString());
    }

    $scope.changeStatus = function(){
      var query = {};
      if($scope.item.status === 'enabled'){
        query = {
          "status":'disabled',
          "name":$scope.item.name,
          "company_id": $scope.owner_id,
          "cid": $scope.cid,
          "oid": $scope.item.oid,
          "adid": $scope.item.adid,
          "password":"test",
          "accessLevel": 0,
          "oldAccessLevel" : $scope.item.accessLevel,
          "myFriends": $scope.item.myFriends
        };
      }else{
        query = {
          "status":'enabled',
          "name":$scope.item.name,
          "company_id": $scope.owner_id,
          "cid": $scope.cid,
          "oid": $scope.item.oid,
          "adid": $scope.item.adid,
          "password":"test",
          "accessLevel": 0,
          "oldAccessLevel" : $scope.item.accessLevel,
          "myFriends": $scope.item.myFriends
        };
      }
      itemsAPIService.putOne($stateParams.serviceId, query)
        .then(
          function successCallback(){
            Notification.success('Service status updated!!');
            initData();
          }
        );
    };

  $scope.deleteItem = function(){
    if(confirm('Are you sure?')){
      itemsAPIService.deleteItem($scope.item.oid)
        .then(
          function successCallback(response){
            Notification.success('service deleted');
            $state.go("root.main.allServices");
          }
        );
      }
    };

// HIDE && SHOW DOM =========================

  //Access Level
  $('a#accessEdit').show();
  $('a#accessSave').hide();
  $('a#accessCancel').hide();
  $('select#editAccessName').hide();
  $('p#accessName').show();

  $scope.changeToInput = function () {
    $('a#accessEdit').hide();
    $('p#accessName').hide();
    $('select#editAccessName').show();
    $('a#accessSave').fadeIn('slow');
    $('a#accessCancel').fadeIn('slow');
  };

  $scope.backToEdit = function () {
    $('a#accessCancel').fadeOut('slow');
    $('a#accessSave').fadeOut('slow');
    $('select#editAccessName').fadeOut('slow');
    setTimeout(function() {
      $('a#accessEdit').fadeIn('fast');
      $('p#accessName').fadeIn('fast');
    }, 600);
  };

  $scope.saveNewAccess = function () {
    if (Number($('select#editAccessName').val()) !== 0){
        itemsAPIService.putOne($stateParams.serviceId,
            {accessLevel: $('select#editAccessName').val() - 1,
            myFriends: $scope.item.myFriends,
            oid: $scope.item.oid,
            oldAccessLevel: $scope.item.accessLevel })
          .then(
            function successCallback(response){
              initData();
              $scope.backToEdit();
            }
          );
        }
      };

  // Serial Number
  $('a#serialEdit').show();
  $('a#serialSave').hide();
  $('a#serialCancel').hide();
  $('input#editSerialInput').hide();
  $('p#serialName').show();

  $scope.changeToInput1 = function () {
    $('a#serialEdit').hide();
    $('p#serialName').hide();
    $('input#editSerialInput').show();
    $('a#serialSave').fadeIn('slow');
    $('a#serialCancel').fadeIn('slow');
  };

  $scope.backToEdit1 = function () {
    $('a#serialCancel').fadeOut('slow');
    $('a#serialSave').fadeOut('slow');
    $('input#editSerialInput').fadeOut('slow');
    setTimeout(function() {
      $('a#serialEdit').fadeIn('fast');
      $('p#serialName').fadeIn('fast');
    }, 600);
  };

  $scope.saveNewSerial = function () {
    if ($('input#editSerialInput').val() !== 0){
        itemsAPIService.putOne($stateParams.serviceId, {"info.serial_number": $scope.devInfo.serial_number})
          .then(
            function successCallback(){  //!!!!!!!!!! zmenit accessLevel na nove cislo, dorobit!!!
              initData();
              $scope.backToEdit1();
            }
          );
        }
      };

  // Location
  $('a#locationEdit').show();
  $('a#locationSave').hide();
  $('a#locationCancel').hide();
  $('input#editLocationInput').hide();
  $('p#locationName').show();

  $scope.changeToInput2 = function () {
    $('a#locationEdit').hide();
    $('p#locationName').hide();
    $('input#editLocationInput').show();
    $('a#locationSave').fadeIn('slow');
    $('a#locationCancel').fadeIn('slow');
  };

  $scope.backToEdit2 = function () {
    $('a#locationCancel').fadeOut('slow');
    $('a#locationSave').fadeOut('slow');
    $('input#editLocationInput').fadeOut('slow');
    setTimeout(function() {
      $('a#locationEdit').fadeIn('fast');
      $('p#locationName').fadeIn('fast');
    }, 600);
  };

  $scope.saveNewLocation = function () {
    if ($('input#editLocationInput').val() !== 0){
        itemsAPIService.putOne($stateParams.serviceId, {"info.location": $scope.devInfo.location})
          .then(
            function successCallback(){  //!!!!!!!!!! zmenit accessLevel na nove cislo, dorobit!!!
              initData();
              $scope.backToEdit2();
            }
          );
        }
      };

// Load picture mgmt =============================

var base64String= "";

$("input#input1").on('change',function(evt) {

  var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

  if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            // $("img#pic").src = fr.result;
            $("img#pic").prop("src",fr.result);
            base64String = fr.result;
        };
        fr.readAsDataURL(files[0]);
    }else{
        // fallback -- perhaps submit the input to an iframe and temporarily store
        // them on the server until the user's session ends.
    }
});

$scope.showLoadPic = function(){
  $scope.showInput = true;
  $('#editCancel1').fadeIn('slow');
  $('#editUpload2').fadeIn('slow');
  $('#input1').fadeIn('slow');
};

$scope.cancelLoadPic = function(){
  $('#editCancel1').fadeOut('slow');
  $('#editUpload2').fadeOut('slow');
  $('#input1').fadeOut('slow');
  $('img#pic').fadeOut('slow');
  setTimeout(function() {
    $("img#pic").prop("src",$scope.item.avatar);
    $('img#pic').fadeIn('slow');
 }, 600);
};

$scope.uploadPic = function(){
  itemsAPIService.putOne($stateParams.serviceId, {avatar: base64String})
    .then(
      function successCallback(response){
        itemsAPIService.getItemWithAdd($stateParams.serviceId)
          .then(
            function successCallback(response) {
              $scope.device = response.data.message;
              $('#editCancel1').fadeOut('slow');
              $('#editUpload2').fadeOut('slow');
              $('#input1').fadeOut('slow');
              $('img#pic').fadeOut('slow');
              setTimeout(function() {
                $("img#pic").prop("src",$scope.device.avatar);
                $('img#pic').fadeIn('slow');
             }, 600);
           }
         );
      }
    );
  };
});
