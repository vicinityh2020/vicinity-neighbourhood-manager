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

    $scope.devices=[];
    $scope.note = ""; //"My devices";
    $scope.tempId = "";
    $scope.loaded = false;
    $scope.noDevices = true;
    $scope.filterTerm = "0";

    itemsAPIService.getMyItems($window.sessionStorage.companyAccountId, "device")
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


});
