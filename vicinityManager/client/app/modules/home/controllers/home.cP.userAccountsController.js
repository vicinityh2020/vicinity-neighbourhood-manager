'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cPuserAccountsController',
function ($scope, $stateParams, commonHelpers, userAPIService, Notification) {
  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.userAccounts=[];
  $scope.companyId = $stateParams.companyAccountId;
  $scope.loaded = false;
  $scope.noUsers = false;

  userAPIService.getAll($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.userAccounts = response.data.message;
        $scope.loaded = true;
        if(response.data.message.length === 0){$scope.noUsers = true;}
      })
      .catch(errorCallback);

    function errorCallback(err){
      console.log(err);
      Notification.error("Server error");
    }

});
