'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('dPwhoSeeController',
function ($scope, $stateParams, userAccountAPIService, itemsAPIService, Notification) {

  $scope.friends=[];
  $scope.note = "";
  $scope.device = {};
  $scope.giveNote = false;
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.deviceId)
    .then(
      function successCallback(response){
        $scope.device = response.data.message[0];
        if ($scope.device.accessLevel === 8){
          userAccountAPIService.getUserAccounts()
            .then(
              function successCallback(response){                                    
                $scope.friends = response.data.message;
              },
              errorCallback
            );
          }else if ($scope.device.accessLevel === 1) {
            $scope.note = "Device is private. No one can see this device.";
            $scope.giveNote = true;
          }else {
            userAccountAPIService.getFriends($scope.device.hasAdministrator[0]._id).then(
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
