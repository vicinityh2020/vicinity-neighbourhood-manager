'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cPuserAccountsController',
function ($scope, $stateParams, commonHelpers, userAccountAPIService) {
  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.userAccounts=[];
  $scope.companyId = $stateParams.companyAccountId;
  $scope.loaded = false;

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.userAccounts = response.data.message.accountOf;
        $scope.loaded = true;
      },
      function errorCallback(response){}
    );

});
