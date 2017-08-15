'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('partneredEntities', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, $stateParams, $window) {
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    // Ensure scroll on top onLoad
        $window.scrollTo(0, 0);

    userAccountAPIService.getFriends($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response){
          var results = response.data.message;
          $scope.resultsList = results;
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );

  });
