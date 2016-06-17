angular.module('VicinityManagerApp.controllers')
.controller('dPhistoryController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.userAccounts = [];
  $scope.companyAccounts = [];
  $scope.thisCompany = {};
  $scope.friendsThisCom = [];
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function(data){
    $scope.device = data.message;

    userAccountAPIService.getUserAccountProfile($scope.device.hasAdministrator[0]._id).success(function (data) {
      $scope.userAccounts = data.message.accountOf;
      $scope.thisCompany = data.message;
    });

    userAccountAPIService.getUserAccounts().success(function (data) {
      $scope.companyAccounts = data.message;
    });

    userAccountAPIService.getFriends($scope.device.hasAdministrator[0]._id).success(function (data) {
      $scope.friendsThisCom = data.message;

    });
    $scope.loaded = true;
  });

});
