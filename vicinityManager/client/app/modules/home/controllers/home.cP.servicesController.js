"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.filter('custom',
 function() {
  return function(input, isFriend, cid) {

    var out = [];
    var keyword = new RegExp(cid);

    angular.forEach(input,
      function(service) {
      var keyLevel = new RegExp(service.accessLevel);
       if (keyword.test(service.hasAdministrator[0]._id) || keyLevel.test("5678") || (keyLevel.test("234") && isFriend) ) {
          out.push(service);
       }
      }
    );
    return out;
  };
})
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
    return userAccountAPIService.getFriends($stateParams.companyAccountId);
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
