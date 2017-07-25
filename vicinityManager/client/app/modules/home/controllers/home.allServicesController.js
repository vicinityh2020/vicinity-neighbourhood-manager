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

       $scope.items=[];
       $scope.onlyPrivateItems = false;
       $scope.loaded = false;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.tempId = "";

      itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, 'service')
      .then(
        function successCallback(response){
        $scope.items = response.data.message;
        var i=0;
        for (var it in $scope.items){
          if ($scope.items[it].accessLevel > 1){
            i++;
          }
        }
        if (i === 0){
          $scope.onlyPrivateItems = true;
        }else{
          $scope.onlyPrivateItems = false;
        }
        $scope.loaded = true;
      },
      function errorCallback(response){
      }
    );

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
