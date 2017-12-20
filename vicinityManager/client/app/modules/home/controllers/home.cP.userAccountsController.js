'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cPuserAccountsController',
function ($scope, $stateParams, commonHelpers, userAPIService) {
  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.userAccounts=[];
  $scope.companyId = $stateParams.companyAccountId;
  $scope.loaded = false;

  userAPIService.getAll($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.userAccounts = response.data.message;
        $scope.loaded = true;
      },
      function errorCallback(response){}
    );

});
