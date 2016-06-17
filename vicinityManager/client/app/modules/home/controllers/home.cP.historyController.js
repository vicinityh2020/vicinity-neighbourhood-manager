angular.module('VicinityManagerApp.controllers')
.controller('cPhistoryController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.userAccounts = [];
  $scope.companyAccounts = [];
  $scope.thisCompany = {};
  $scope.friendsThisCom = [];
  $scope.loaded = false;

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(function (data) {
    $scope.userAccounts = data.message.accountOf;
    $scope.thisCompany = data.message;

    userAccountAPIService.getUserAccounts().success(function (data) {
      $scope.companyAccounts = data.message;
    });


    userAccountAPIService.getFriends($stateParams.companyAccountId).success(function (data) {
      $scope.friendsThisCom = data.message;
      $scope.loaded = true;
    });

  });


});
