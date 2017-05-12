angular.module('VicinityManagerApp.controllers')
.controller('dPhistoryController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.userAccounts = [];
  $scope.companyAccounts = [];
  $scope.thisCompany = {};
  $scope.friendsThisCom = [];
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.deviceId)
    .then(
      function successCallback(response){
        $scope.device = response.data.message;

        userAccountAPIService.getUserAccountProfile($scope.device.hasAdministrator[0]._id)
          .then(
            function successCallback(response) {
              $scope.userAccounts = response.data.message.accountOf;
              $scope.thisCompany = response.data.message;
            },
            function errorCallback(response){
            }
          );

        userAccountAPIService.getUserAccounts()
          .then(
            function successCallback(response) {
              $scope.companyAccounts = data.message;
            },
            function errorCallback(response){
            }
          );

        userAccountAPIService.getFriends($scope.device.hasAdministrator[0]._id)
          .then(
            function successCallback(response){
              $scope.friendsThisCom = data.message;
            },
            function errorCallback(response){
            }
          );
        $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );

});
