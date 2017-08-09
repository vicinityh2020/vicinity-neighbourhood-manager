'use strict';
angular.module('VicinityManagerApp.controllers')
.filter('customAllServs',
 function() {
  return function(input, searchTerm) {

    var out = [];
    var keyword = new RegExp(searchTerm, "i");

    angular.forEach(input,
      function(item) {
       if (keyword.test(item.name)) {
          out.push(item);
       }
      }
    );
    return out;
  };
})
.controller('allServicesController',
   function ($scope,
            $window,
            itemsAPIService,
            Notification){

// Initialize variables and get initial data =============
      $(window).trigger('resize');

       $scope.items=[];
       $scope.onlyPrivateItems = false;
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.noItems = true;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.tempId = "";
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
          $scope.noItems = (response.data.message.length === 0);
          $scope.allItemsLoaded = response.data.message.length < 12;

        if ($scope.items.length === 0){
          $scope.onlyPrivateItems = true;
        }else{
          $scope.onlyPrivateItems = false;
        }
        $scope.loaded = true;
        $scope.loadedPage = true;
      },
      errorCallback
    );
  }

// Trigers load of more items

  $scope.loadMore = function(){
      $scope.loaded = false;
      $scope.offset += 12;
      init();
  };

// Manage access request functions =====================

   $scope.processMyAccess = function(it_id) {
     $scope.tempId = it_id;
     itemsAPIService.processItemAccess(it_id)
     .then(processingAccess,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyRequest = function(it_id) {
     $scope.tempId = it_id;
     itemsAPIService.cancelItemRequest(it_id)
     .then(cancellingRequest,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyAccess = function(it_id) {
     $scope.tempId = it_id;
     $scope.note = "";
     itemsAPIService.cancelItemAccess(it_id)
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
    for (var it in $scope.items){
      if ($scope.items[it]._id.toString() === response.data.message[0]._id.toString()){
          $scope.items[it] = response.data.message[0];
      }
    }
  }

});
