'use strict';
angular.module('VicinityManagerApp.controllers')
.filter('customAllDevs',
 function() {
  return function(input, searchTerm) {

    var out = [];
    var keyword = new RegExp(searchTerm, "i");

    angular.forEach(input,
      function(device) {
       if (keyword.test(device.name)) {
          out.push(device);
       }
      }
    );
    return out;
  };
})
.controller('allDevicesController',
   function ($scope,
     $window,
     $interval,
     itemsAPIService,
     Notification)
     {


// ====== Trigger for the first time window resize to avoid bug =======
    $(window).trigger('resize');
      $interval(waitTillLoad, 100, 1);
      function waitTillLoad(){
        $(window).trigger('resize');
      }

  // Initialize variables and get initial data =============

       $scope.comps=[];
       $scope.devs=[];
       $scope.onlyPrivateDevices = false;
       $scope.note="Access for friends";
       $scope.isF = 0;
       $scope.loaded = false;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.tempId = "";

      itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, "device")
      .then(
        function successCallback(response){
        $scope.devs = response.data.message;
        var i=0;
        for (var dev in $scope.devs){
          if ($scope.devs[dev].accessLevel > 1){
            i++;
          }
        }
        if (i === 0){
          $scope.onlyPrivateDevices = true;
        }else{
          $scope.onlyPrivateDevices = false;
        }
        $scope.loaded = true;
      },
      function errorCallback(response){
      }
    );

// Manage access request functions =====================

   $scope.processMyAccess = function(dev_id) {
     $scope.tempId = dev_id;
     itemsAPIService.processItemAccess(dev_id)
     .then(processingAccess,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyRequest = function(dev_id) {
     $scope.tempId = dev_id;
     itemsAPIService.cancelItemRequest(dev_id)
     .then(cancellingRequest,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyAccess = function(dev_id) {
     $scope.tempId = dev_id;
     $scope.note = "";
     itemsAPIService.cancelItemAccess(dev_id)
     .then(cancellingAccess,errorCallback)
     .then(getItem,errorCallback);
   };

// Callbacks and helpers ===============

   function processingAccess(response){
     if (response.data.message.error) {
         Notification.error("Sending data access request failed!");
     } else {
         Notification.success("Access request sent!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function cancellingRequest(response){
     if (response.data.message.error) {
         Notification.error("Sending data access request failed!");
     } else {
         Notification.success("Data access request canceled!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function cancellingAccess(response){
     if (response.data.message.error) {
         Notification.error("Try for interruption failed!");
     } else {
         Notification.success("Connection interrupted!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function getItem(response){
     updateScopeAttributes(response);
     $scope.tempId = "";
   }

  function errorCallback(err){
    Notification.error("Something went wrong: " + err);
  }

  function updateScopeAttributes(response){
    for (var dev in $scope.devs){
      if ($scope.devs[dev]._id.toString() === response.data.message[0]._id.toString()){
          $scope.devs[dev] = response.data.message[0];
      }
    }
  }

});
