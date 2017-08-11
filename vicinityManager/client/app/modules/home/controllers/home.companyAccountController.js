angular.module('VicinityManagerApp.controllers').
controller('companyAccountController', function($scope, $window, commonHelpers, userAccountAPIService, AuthenticationService) {

  // ====== Triggers window resize to avoid bug =======
      commonHelpers.triggerResize();

      $scope.name = {};
      $scope.avatar = {};
      // $scope.occupation = {};
      // $scope.organisation = {};
      $scope.companyAccountId = {};
      $scope.loaded = false;
      n=0;


      userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId)
        .then(
          function successCallback(response) {

            $scope.name = response.data.message.organisation;
            $scope.avatar = response.data.message.avatar;
            $scope.companyAccountId = response.data.message._id;
            $scope.loaded = true;
          },
          function errorCallback(response){
          }
        );
});
