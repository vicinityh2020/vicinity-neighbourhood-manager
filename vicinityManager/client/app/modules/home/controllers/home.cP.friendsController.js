angular.module('VicinityManagerApp.controllers')
.controller('cPfriendsController',
function ($scope, $stateParams, userAccountAPIService) {

  $scope.friends = [];
  $scope.loaded = false;

  userAccountAPIService.getFriends($stateParams.companyAccountId).then(
    function successCallback(response) {
    $scope.friends = response.data.message;
    $scope.loaded = true;
    },
    function errorCallback(response){}
  );

});
