'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allDevicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers){

// ====== Triggers window resize to avoid bug =======

    commonHelpers.triggerResize();

// Ensure scroll on top onLoad
    $window.scrollTo(0, 0);

  // Initialize variables and get initial data =============

       $scope.devs=[];
       $scope.onlyPrivateDevices = false;
       $scope.note="Access for friends";
       $scope.noItems = true;
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.offset = 0;
       $scope.allItemsLoaded = false;

       init();

       function init(){
          itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, "device", $scope.offset)
          .then(
            function successCallback(response){
              for(var i = 0; i < response.data.message.length; i++){
                  $scope.devs.push(response.data.message[i]);
              }

              $scope.noItems = ($scope.devs.length === 0);
              $scope.allItemsLoaded = response.data.message.length < 12;
              $scope.loaded = true;
              $scope.loadedPage = true;
           
	     },
             itemsHelpers.errorCallback
          );
        }

// Manage access request functions =====================

   $scope.processMyAccess = function(dev_id) {
     itemsAPIService.processItemAccess(dev_id)
     .then(itemsHelpers.processingAccess,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
    };

   $scope.cancelMyRequest = function(dev_id) {
     itemsAPIService.cancelItemRequest(dev_id)
     .then(itemsHelpers.cancellingRequest,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
    };

   $scope.cancelMyAccess = function(dev_id) {
     $scope.note = "";
     itemsAPIService.cancelItemAccess(dev_id)
     .then(itemsHelpers.cancellingAccess,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
   };

// Refresh scope

  function updateScopeAttributes(response){
    for (var dev in $scope.devs){
      if ($scope.devs[dev]._id.toString() === response.data.message[0]._id.toString()){
          $scope.devs[dev] = response.data.message[0];
      }
    }
  }

  // Trigers load of more items

  $scope.loadMore = function(){
      $scope.loaded = false;
      $scope.offset += 12;
      init();
  };

});
