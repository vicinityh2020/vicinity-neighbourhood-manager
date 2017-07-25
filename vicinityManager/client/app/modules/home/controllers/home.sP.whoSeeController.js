'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('sPwhoSeeController',
function ($scope, $stateParams, userAccountAPIService, itemsAPIService, Notification) {

  $scope.friends=[];
  $scope.note = "";
  $scope.item = {};
  $scope.giveNote = false;
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.serviceId)
    .then(
      function successCallback(response){
        $scope.item = response.data.message[0];
        if ($scope.item.accessLevel === 8){
          userAccountAPIService.getUserAccounts()
            .then(
              function successCallback(response){
                $scope.friends = response.data.message;
              },
              errorCallback
            );
          }else if ($scope.item.accessLevel === 1) {
            $scope.note = "Item is private. No one can see this item.";
            $scope.giveNote = true;
          }else {
            userAccountAPIService.getFriends($scope.item.hasAdministrator[0]._id).then(
              function successCallback(response){
                $scope.friends = response.data.message;
              },
              errorCallback
            );
          }
          $scope.loaded = true;
        },
        errorCallback
      );

      function errorCallback(err){
        Notification.error("There was an error: " + err);
      }
});
