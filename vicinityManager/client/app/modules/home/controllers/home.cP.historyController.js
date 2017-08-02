angular.module('VicinityManagerApp.controllers')
.controller('cPhistoryController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {
  $(window).trigger('resize');
  $scope.userAccounts = [];
  $scope.companyAccounts = [];
  $scope.thisCompany = {};
  $scope.friendsThisCom = [];
  $scope.loaded = false;

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(response) {
        $scope.userAccounts = response.data.message.accountOf;
        $scope.thisCompany = response.data.message;

        userAccountAPIService.getUserAccounts()
          .then(
            function successCallback (response) {
          $scope.companyAccounts = response.data.message;
        },
        function errorCallback(response){}
      );


    userAccountAPIService.getFriends($stateParams.companyAccountId).then(
      function successCallback(response) {
        $scope.friendsThisCom = response.data.message;
        $scope.loaded = true;
      },
      function errorCallback(response){}
    );
  },
  function errorCallback(response){}
);

});
