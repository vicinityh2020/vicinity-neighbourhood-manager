'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('deviceProfileController',
function ($scope, $window, $state, $stateParams, $location, itemsAPIService, Notification) {

  $scope.locationPrefix = $location.path();
  // console.log("location:" + $location.path());

// Initialize variables and data =====================
  $(window).trigger('resize');
  $scope.devEnabled = false;
  $scope.showInput = false;
  $scope.isMyDevice = false;
  $scope.loaded = false;
  $scope.canSeeData = false;
  $scope.device = {};
  $scope.devInfo = {};
  $scope.AL = 0;

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
    }

    function updateScopeAttributes(response){
        $scope.device = response.data.message[0];
        $scope.devInfo = $scope.device.info;
        $scope.owner = $scope.device.hasAdministrator[0].organisation;
        $scope.owner_id = $scope.device.hasAdministrator[0]._id;
        $scope.AL = $scope.device.accessLevel;
        $scope.devEnabled = ($scope.device.status === 'enabled');
        $scope.canSeeData = $scope.device.seeData;

        var aux = ["Private", "Metadata Only", "Data Under Request", "Shared with partners", "Public Metadata Only", "Public Data Under Request", "Public Shared with partners", "Public"];
        $scope.ALcaption = aux[$scope.AL - 1];

        $scope.isMyDevice = ($window.sessionStorage.companyAccountId.toString() === $scope.owner_id.toString());
    }

    $scope.changeStatus = function(){
      var query = {};
      if($scope.device.status === 'enabled'){
        query = {
          "status":'disabled',
          "name":$scope.device.name,
          "cid": $scope.owner_id,
          "oid": $scope.device.oid,
          "aid": $scope.device.aid,
          "password":"test"
        };
      }else{
        query = {
          "status":'enabled',
          "name":$scope.device.name,
          "cid": $scope.owner_id,
          "oid": $scope.device.oid,
          "aid": $scope.device.aid,
          "password":"test"
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

  //  TODO delete when obsolete from controller and view

  //   $scope.makeItem = function(){
  //     var thingDescr =
  //     [
  //       {
  //         "actions": [
  //           {
  //             "affects": "OnOff",
  //             "aid": "status",
  //             "input": {
  //               "datatype": "",
  //               "units": "Adimensional"
  //             },
  //             "read_links": [
  //               {
  //                 "href": "/objects/edcb20b9-c5ad-4283-bc66-c40032498fab/properties/status",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "write_links": [
  //               {
  //                 "href": "/objects/{oid}/actions/UCtrlOnOff",
  //                 "mediaType": "application/json"
  //               }
  //             ]
  //           }
  //         ],
  //         "oid": "12345",
  //         "owner": $scope.owner_id,
  //         "properties": [
  //           {
  //             "monitors": "MeanPowerConsumption",
  //             "output": {
  //               "datatype": "",
  //               "units": "W"
  //             },
  //             "pid": "consumption",
  //             "read_links": [
  //               {
  //                 "href": "/objects/edcb20b9-c5ad-4283-bc66-c40032498fab/properties/consumption",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "writable": false,
  //             "write_links": []
  //           }
  //         ],
  //         credentials:{
  //           name:"obj_2",
  //           password:"1111"
  //         },
  //         "type": "PowerMeter"
  //       },
  //       {
  //         "actions": [
  //           {
  //             "affects": "OnOff",
  //             "aid": "status",
  //             "input": {
  //               "datatype": "",
  //               "units": "Adimensional"
  //             },
  //             "read_links": [
  //               {
  //                 "href": "/objects/4971fc10-bf07-43b1-8311-d0bbdf5ca0d4/properties/status",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "write_links": [
  //               {
  //                 "href": "/objects/{oid}/actions/UCtrlOnOff",
  //                 "mediaType": "application/json"
  //               }
  //             ]
  //           }
  //         ],
  //         "oid": "23456",
  //         "owner": $scope.owner_id,
  //         "properties": [
  //           {
  //             "monitors": "MeanPowerConsumption",
  //             "output": {
  //               "datatype": "",
  //               "units": "W"
  //             },
  //             "pid": "consumption",
  //             "read_links": [
  //               {
  //                 "href": "/objects/4971fc10-bf07-43b1-8311-d0bbdf5ca0d4/properties/consumption",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "writable": false,
  //             "write_links": []
  //           }
  //         ],
  //         credentials:{
  //           name:"obj_3",
  //           password:"1111"
  //         },
  //         "type": "PowerMeter"
  //       },
  //       {
  //         "actions": [],
  //         "oid": "34567",
  //         "owner": $scope.owner_id,
  //         "properties": [
  //           {
  //             "monitors": "RelativeHumidity",
  //             "output": {
  //               "datatype": "",
  //               "units": "%"
  //             },
  //             "pid": "humidity",
  //             "read_links": [
  //               {
  //                 "href": "/objects/d6e5acc3-dc29-417f-aa10-ebad34bf9db3/properties/humidity",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "writable": false,
  //             "write_links": []
  //           },
  //           {
  //             "monitors": "AmbientTemperature",
  //             "output": {
  //               "datatype": "",
  //               "units": "Î’Â°C"
  //             },
  //             "pid": "temperature",
  //             "read_links": [
  //               {
  //                 "href": "/objects/d6e5acc3-dc29-417f-aa10-ebad34bf9db3/properties/temperature",
  //                 "mediaType": "application/json"
  //               }
  //             ],
  //             "writable": false,
  //             "write_links": []
  //           }
  //         ],
  //         credentials:{
  //           name:"obj_1",
  //           password:"1111"
  //         },
  //         "type": "Thermometer"
  //       }
  //       ];
  //
  //     var query = {
  //         aid: "59759ff581ee7f03580da306", // test with unikl agent
  //         thingDescriptions: thingDescr
  //     };
  //
  //     itemsAPIService.postBulk("59759ff581ee7f03580da306")
  //       .then(
  //         function successCallback(response){
  //           $window.alert('done');
  //         }
  //       );
  // };

  $scope.deleteItem = function(){
    itemsAPIService.deleteItem($scope.device.oid)
      .then(
        function successCallback(response){
          Notification.success('Device deleted');
          $state.go("root.main.mydevices");
        }
      );
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
    if ($('select#editAccessName').val() !== 0){
        itemsAPIService.putOne($stateParams.deviceId, {accessLevel: $('select#editAccessName').val(),
                                                      myFriends: $scope.device.myFriends,
                                                      oid: $scope.device.oid,
                                                      oldAccessLevel: $scope.device.accessLevel })
          .then(
            function successCallback(response){  //!!!!!!!!!! zmenit accessLevel na nove cislo, dorobit!!!
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
        itemsAPIService.putOne($stateParams.deviceId, {"info.serial_number": $scope.devInfo.serial_number})
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
        itemsAPIService.putOne($stateParams.deviceId, {"info.location": $scope.devInfo.location})
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
