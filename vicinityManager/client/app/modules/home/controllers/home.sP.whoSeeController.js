'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('sPwhoSeeController',
function ($scope, $stateParams, commonHelpers, userAccountAPIService, itemsAPIService, Notification) {
  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.friends=[];
  $scope.note = "";
  $scope.item = {};
  $scope.giveNote = false;
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.serviceId)
    .then(function(response){
        $scope.item = response.data.message[0];
        if ($scope.item.accessLevel === 1){
          userAccountAPIService.getUserAccountProfile($scope.item.cid.id._id)
          .then(function(response){
            $scope.friends = response.data.message.knows;
          })
          .catch(errorCallback);
          }else if ($scope.item.accessLevel === 0) {
            $scope.note = "Item is private. No one can see this item.";
            $scope.giveNote = true;
          }else {
            $scope.note = "Item has public visibility. Everyone can see it.";
            $scope.giveNote = true;
          }
          $scope.loaded = true;
        })
        .catch(errorCallback);

      function errorCallback(err){
        console.log(err);
        Notification.error("Server error");
      }
});
