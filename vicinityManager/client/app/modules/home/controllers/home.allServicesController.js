'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allServicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers){

// ====== Triggers window resize to avoid bug =======
     commonHelpers.triggerResize();

     // Ensure scroll on top onLoad
         $window.scrollTo(0, 0);

// Initialize variables and get initial data =============

       $scope.items=[];
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.noItems = true;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.offset = 0;
       $scope.allItemsLoaded = false;
       $scope.filterNumber = 7;
       $scope.typeOfItem = "services";
       $scope.header = "All Services";

       init();

      function init(){
      itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, 'service', $scope.offset, $scope.filterNumber)
      .then(
        function successCallback(response){
          for(var i = 0; i < response.data.message.length; i++){
              $scope.items.push(response.data.message[i]);
          }
          $scope.noItems = ($scope.items.length === 0);
          $scope.allItemsLoaded = response.data.message.length < 12;
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

  // Filters items

  $scope.filterItems = function(n){
      $scope.filterNumber = n;
      $scope.offset = 0;
      changeHeader(n);
      $scope.items=[];
      init();
  };

  function changeHeader(n){
    switch (n) {
        case 0:
            $scope.header = "My disabled " + $scope.typeOfItem;
            break;
        case 1:
            $scope.header = "My private " + $scope.typeOfItem;
            break;
        case 2:
            $scope.header = "My shared " + $scope.typeOfItem;
            break;
        case 3:
            $scope.header = "My public " + $scope.typeOfItem;
            break;
        case 4:
            $scope.header = "My " + $scope.typeOfItem;
            break;
        case 5:
            $scope.header = "All shared " + $scope.typeOfItem;
            break;
        case 6:
            $scope.header = "All public " + $scope.typeOfItem;
            break;
        case 7:
            $scope.header = "All " + $scope.typeOfItem;
            break;
          }
      }

  // Trigers load of more items

    $scope.loadMore = function(){
        $scope.loaded = false;
        $scope.offset += 12;
        init();
    };

});
