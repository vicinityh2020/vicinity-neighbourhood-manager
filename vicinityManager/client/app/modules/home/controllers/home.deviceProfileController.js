'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('deviceProfileController',
function ($scope, $window, $state, commonHelpers, tokenDecoder, $stateParams, $location, itemsAPIService, Notification) {

  $scope.locationPrefix = $location.path();

// Initialize variables and data =====================

  commonHelpers.triggerResize(); // Triggers window resize to avoid bug

  $scope.devEnabled = false;
  $scope.showInput = false;
  $scope.isMyDevice = false;
  $scope.loaded = false;
  $scope.canSeeData = false;
  $scope.device = {};
  $scope.devInfo = {};
  $scope.AL = 0;
  $scope.imDeviceOwner = false;

  initData();

  function initData(){
    itemsAPIService.getItemWithAdd($stateParams.deviceId)
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
        if(payload.roles[i] === 'infrastructure operator'){
          $scope.imDeviceOwner = true;
        }
      }
    }

    function updateScopeAttributes(response){
        $scope.device = response.data.message[0];
        $scope.devInfo = $scope.device.info;
        $scope.owner = $scope.device.hasAdministrator[0].organisation;
        $scope.owner_id = $scope.device.hasAdministrator[0]._id;
        $scope.cid = $scope.device.hasAdministrator[0].cid;
        $scope.AL = $scope.device.accessLevel;
        $scope.devEnabled = ($scope.device.status === 'enabled');
        $scope.canSeeData = $scope.device.seeData;
        $scope.myFriends = $scope.device.myFriends;
        var aux = ["Private", "Partners without Data", "Partners with Data Under Request", "Partners including Data", "Public without Data", "Public with Data Under Request", "Public including Data for Partners", "Public"];
        $scope.ALcaption = aux[$scope.AL - 1];

        $scope.isMyDevice = ($window.sessionStorage.companyAccountId.toString() === $scope.owner_id.toString());
    }

    $scope.changeStatus = function(){
      var query = {};
      if($scope.device.status === 'enabled'){
        query = {
          "status":'disabled',
          "name":$scope.device.name,
          "company_id": $scope.owner_id,
          "oid": $scope.device.oid,
          "cid": $scope.cid,
          "adid": $scope.device.adid,
          "password":"test",
          "accessLevel": 1, // Always 1 when enabling/disabling
          "oldAccessLevel" : $scope.device.accessLevel,
          "myFriends": $scope.myFriends
        };
      }else{
        query = {
          "status":'enabled',
          "name":$scope.device.name,
          "company_id": $scope.owner_id,
          "cid": $scope.cid,
          "oid": $scope.device.oid,
          "adid": $scope.device.adid,
          "password":"test",
          "accessLevel": 1, // Always 1 when enabling/disabling
          "oldAccessLevel" : $scope.device.accessLevel,
          "myFriends": $scope.myFriends
        };
      }
      itemsAPIService.putOne($stateParams.deviceId, query)
        .then(
          function successCallback(){
            Notification.success('Device status updated!!');
            initData();
          }
        );
    };

  $scope.deleteItem = function(){
    if(confirm('Are you sure?')){
      itemsAPIService.deleteItem($scope.device.oid)
        .then(
          function successCallback(response){
            Notification.success('Device deleted');
            $state.go("root.main.home");
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
        itemsAPIService.putOne($stateParams.deviceId,
          {accessLevel: $('select#editAccessName').val(),
          cid: $scope.owner_id,
          myFriends: $scope.myFriends,
          oid: $scope.device.oid,
          oldAccessLevel: $scope.device.accessLevel })
          .then(
            function successCallback(response){
              initData();
              $scope.backToEdit();
            }
          );
        }
      };


  // Serial Number

  // $('a#serialEdit').show();
  // $('a#serialSave').hide();
  // $('a#serialCancel').hide();
  // $('input#editSerialInput').hide();
  // $('p#serialName').show();
  //
  // $scope.changeToInput1 = function () {
  //   $('a#serialEdit').hide();
  //   $('p#serialName').hide();
  //   $('input#editSerialInput').show();
  //   $('a#serialSave').fadeIn('slow');
  //   $('a#serialCancel').fadeIn('slow');
  // };
  //
  // $scope.backToEdit1 = function () {
  //   $('a#serialCancel').fadeOut('slow');
  //   $('a#serialSave').fadeOut('slow');
  //   $('input#editSerialInput').fadeOut('slow');
  //   setTimeout(function() {
  //     $('a#serialEdit').fadeIn('fast');
  //     $('p#serialName').fadeIn('fast');
  //   }, 600);
  // };
  //
  // $scope.saveNewSerial = function () {
  //   if ($('input#editSerialInput').val() !== 0){
  //       itemsAPIService.putOne($stateParams.deviceId, {"info.serial_number": $scope.devInfo.serial_number})
  //         .then(
  //           function successCallback(){
  //             initData();
  //             $scope.backToEdit1();
  //           }
  //         );
  //       }
  //     };
  //
  // // Location
  // $('a#locationEdit').show();
  // $('a#locationSave').hide();
  // $('a#locationCancel').hide();
  // $('input#editLocationInput').hide();
  // $('p#locationName').show();
  //
  // $scope.changeToInput2 = function () {
  //   $('a#locationEdit').hide();
  //   $('p#locationName').hide();
  //   $('input#editLocationInput').show();
  //   $('a#locationSave').fadeIn('slow');
  //   $('a#locationCancel').fadeIn('slow');
  // };
  //
  // $scope.backToEdit2 = function () {
  //   $('a#locationCancel').fadeOut('slow');
  //   $('a#locationSave').fadeOut('slow');
  //   $('input#editLocationInput').fadeOut('slow');
  //   setTimeout(function() {
  //     $('a#locationEdit').fadeIn('fast');
  //     $('p#locationName').fadeIn('fast');
  //   }, 600);
  // };
  //
  // $scope.saveNewLocation = function () {
  //   if ($('input#editLocationInput').val() !== 0){
  //       itemsAPIService.putOne($stateParams.deviceId, {"info.location": $scope.devInfo.location})
  //         .then(
  //           function successCallback(){
  //             initData();
  //             $scope.backToEdit2();
  //           }
  //         );
  //       }
  //     };

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
    $("img#pic").prop("src",$scope.device.avatar);
    $('img#pic').fadeIn('slow');
 }, 600);
};

$scope.uploadPic = function(){
  itemsAPIService.putOne($stateParams.deviceId, {avatar: base64String})
    .then(
      function successCallback(response){
        itemsAPIService.getItemWithAdd($stateParams.deviceId)
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
