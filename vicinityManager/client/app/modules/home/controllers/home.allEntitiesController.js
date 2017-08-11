'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('allEntities', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, $stateParams, $window) {

    // Variables
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    // Get initial resources
    userAccountAPIService.getUserAccounts()
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
