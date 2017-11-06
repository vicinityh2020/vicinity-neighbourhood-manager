"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.controller('cPservicesController',
function ($scope, $window, commonHelpers, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService,  Notification, customFilter) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.cid = $window.sessionStorage.companyAccountId.toString();
  $scope.services = [];
  $scope.friends = [];
  $scope.isFriend = false;
  $scope.loaded = false;

  itemsAPIService.getMyItems($stateParams.companyAccountId,'service')
    .then(successCallback1, errorCallback)
    .then(successCallback2, errorCallback);

  function successCallback1(response) {
    $scope.services = response.data.message;
    return userAccountAPIService.getUserAccounts($stateParams.companyAccountId, 1);
  }

  function successCallback2(response) {
   $scope.friends = response.data.message;
   for (var fr in $scope.friends){
       if ($scope.friends[fr]._id.toString()===$window.sessionStorage.companyAccountId.toString()){
         $scope.isFriend = true;
       }
     }
     $scope.loaded = true;
   }

  function errorCallback(err){
    Notification.error("Problem retrieving devices: " + err);
  }

});
