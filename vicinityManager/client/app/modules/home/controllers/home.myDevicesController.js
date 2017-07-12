'use strict';
angular.module('VicinityManagerApp.controllers')
.filter('customMyDevs',
 function() {
  return function(input, filterTerm) {

    var out = [];

    angular.forEach(input,
      function(device) {
        var key = new RegExp(device.accessLevel, "i");
        if(filterTerm !== "0"){
          if (key.test(filterTerm)) {
            out.push(device);
          }
        } else {
          out.push(device);
        }
      }
    );
    return out;
  };
})
.controller('myDevicesController',
    function ( $scope,
               $window,
               $stateParams,
               itemsAPIService,
               Notification){

// Initialize variables and retrieve initial data -----------------

    $scope.canAnswerNeighbourRequest = false;
    $scope.interruptConnection = false;
    $scope.devices=[];
    $scope.note = ""; //"My devices";
    $scope.tempId = "";
    $scope.showAllDevices = true;
    $scope.showPrivateDevices = false;
    $scope.showMetaDevices = false;
    $scope.showFriendDevices = false;
    $scope.showPublicDevices = false;
    $scope.loaded = false;
    $scope.noDevices = true;
    $scope.filterTerm = "0";

    itemsAPIService.getMyDevices($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response) {
           $scope.devices = response.data.message;

           if ($scope.devices.length === 0){
             $scope.noDevices = true;
           }else{
             $scope.noDevices = false;
           }

           $scope.loaded = true;
         },
         function errorCallback(response){
         }
       );

// Different views (Dropdown) --------------------------------------

    $scope.allDevices = function () {
      $scope.filterTerm = "0";
    };

    $scope.privateDevices = function () {
      $scope.filterTerm = "1";
    };

    $scope.friendDevices = function () {
      $scope.filterTerm = "234";
    };

    $scope.publicDevices = function () {
      $scope.filterTerm = "5678";
    };


// // REQUESTS ===============
//
//   $scope.acceptDataRequest = function(dev_id) {
//     $scope.tempId = dev_id;
//     itemsAPIService.acceptDeviceRequest(dev_id)
//     .then(acceptingData,errorCallback)
//     .then(getItem,errorCallback);
//    };
//
//    $scope.rejectDataRequest = function(dev_id) {
//      $scope.tempId = dev_id;
//      itemsAPIService.rejectDeviceRequest(dev_id)
//      .then(rejectingData,errorCallback)
//      .then(getItem,errorCallback);
//     };
//
// // Callbacks and helpers ===============
//
//     function acceptingData(response){
//       if (response.data.message.error === true) {
//           Notification.error("Sending data access request failed!");
//       } else {
//           Notification.success("Data access approved!");
//       }
//       return itemsAPIService.getItemWithAdd($scope.tempId);
//     }
//
//     function rejectingData(response){
//       if (response.data.message.error === true) {
//           Notification.error("Sending data access request failed!");
//       } else {
//           Notification.success("Data access rejected!");
//       }
//       return itemsAPIService.getItemWithAdd($scope.tempId);
//     }
//
//     function getItem(response){
//       updateScopeAttributes(response);
//       $scope.tempId = "";
//     }
//
//     function errorCallback(err){
//         Notification.error("Something went wrong: " + err);
//     }
//
//     function updateScopeAttributes(response){          //response je formatu ako z funkcie getItemWithAdd
//       for (var dev in $scope.devices){
//         if ($scope.devices[dev]._id.toString() === response.data.message[0]._id.toString()){        //updatne len ten device, ktory potrebujeme
//           $scope.devices[dev] = response.data.message[0];
//         }
//       }
//     }

});
