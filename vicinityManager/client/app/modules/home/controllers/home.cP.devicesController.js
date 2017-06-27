"use strict";
angular.module('VicinityManagerApp.controllers')
.filter('custom',
 function() {
  return function(input, isFriend, cid) {

    var out = [];
    var keyword = new RegExp(cid);
    var keyword2 = new RegExp("2");
    var keyword3 = new RegExp("3");
    var keyword4 = new RegExp("4");

    angular.forEach(input,
      function(device) {
       if (keyword.test(device.hasAdministrator[0]._id) || keyword.test(device.hasAccess) || keyword4.test(device.accessLevel) || ((keyword3.test(device.accessLevel) || keyword2.test(device.accessLevel)) && isFriend)) {
          out.push(device);
       }
      }
    );
    return out;
  };
})
.controller('cPdevicesController', ['$scope', '$window', '$stateParams', '$location', 'userAccountAPIService', 'itemsAPIService', 'AuthenticationService', 'Notification', 'customFilter',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService,  Notification, customFilter) {
  $scope.cid = $window.sessionStorage.companyAccountId.toString();
  $scope.devices = [];
  $scope.friends = [];
  $scope.isFriend = false;
  $scope.loaded = false;

  userAccountAPIService.getMyDevices($stateParams.companyAccountId)
    .then(successCallback1, errorCallback)
    .then(successCallback2, errorCallback);

  function successCallback1(response) {
    $scope.devices = response.data.message;
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

}]);
