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
               $interval,
               itemsAPIService,
               Notification){

// Initialize variables and retrieve initial data -----------------

    $scope.devices=[];
    $scope.note = ""; //"My devices";
    $scope.tempId = "";
    $scope.loaded = false;
    $scope.loadedPage = false;
    $scope.noDevices = true;
    $scope.filterTerm = "0";
    $scope.offset = 0;
    $scope.allItemsLoaded = false;
    $scope.noItems = true;

    // ====== Triggers window resize to avoid bug =======
        $(window).trigger('resize');
          $interval(waitTillLoad, 100, 1);
          function waitTillLoad(){
            $(window).trigger('resize');
          }

    init();

    function init(){
    itemsAPIService.getMyItems($window.sessionStorage.companyAccountId, "device", $scope.offset)
      .then(
        function successCallback(response) {
          for(var i = 0; i < response.data.message.length; i++){
              $scope.devices.push(response.data.message[i]);
          }
          $scope.noItems = ($scope.devices.length === 0);
          $scope.allItemsLoaded = response.data.message.length < 12;
          $scope.loaded = true;
          $scope.loadedPage = true;
         },
         errorCallback
       );
     }

// Handles errors

     function errorCallback(err){
       Notification.error("Something went wrong: " + err);
     }

// Trigers load of more items

     $scope.loadMore = function(){
         $scope.loaded = false;
         $scope.offset += 12;
         init();
     };


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
