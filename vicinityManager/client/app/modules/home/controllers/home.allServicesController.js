'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allServicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers){

// ====== Triggers window resize to avoid bug =======
     commonHelpers.triggerResize();

// Initialize variables and get initial data =============

       $scope.items=[];
       $scope.onlyPrivateItems = false;
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.noItems = true;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.offset = 0;
       $scope.allItemsLoaded = false;

       init();

      function init(){
      itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, 'service')
      .then(
        function successCallback(response){
          for(var i = 0; i < response.data.message.length; i++){
              $scope.items.push(response.data.message[i]);
          }
          $scope.noItems = ($scope.items.length === 0);
          $scope.allItemsLoaded = response.data.message.length < 12;

        if ($scope.items.length === 0){
          $scope.onlyPrivateItems = true;
        }else{
          $scope.onlyPrivateItems = false;
        }
        $scope.loaded = true;
        $scope.loadedPage = true;
      },
      itemsHelpers.errorCallback
    );
  }

  // Manage access request functions =====================

     $scope.processMyAccess = function(it_id) {
       itemsAPIService.processItemAccess(it_id)
       .then(itemsHelpers.processingAccess,itemsHelpers.errorCallback)
       .then(updateScopeAttributes,itemsHelpers.errorCallback);
      };

     $scope.cancelMyRequest = function(it_id) {
       itemsAPIService.cancelItemRequest(it_id)
       .then(itemsHelpers.cancellingRequest,itemsHelpers.errorCallback)
       .then(updateScopeAttributes,itemsHelpers.errorCallback);
      };

     $scope.cancelMyAccess = function(it_id) {
       $scope.note = "";
       itemsAPIService.cancelItemAccess(it_id)
       .then(itemsHelpers.cancellingAccess,itemsHelpers.errorCallback)
       .then(updateScopeAttributes,itemsHelpers.errorCallback);
     };

// Refresh scope

  function updateScopeAttributes(response){
    for (var it in $scope.items){
      if ($scope.items[it]._id.toString() === response.data.message[0]._id.toString()){
          $scope.items[it] = response.data.message[0];
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
