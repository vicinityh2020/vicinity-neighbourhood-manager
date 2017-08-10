angular.module('VicinityManagerApp.controllers')
.controller('cPuserAccountsController',
function ($scope, $stateParams, $interval, userAccountAPIService) {
  // ====== Triggers window resize to avoid bug =======
      $(window).trigger('resize');
        $interval(waitTillLoad, 100, 1);
        function waitTillLoad(){
          $(window).trigger('resize');
        }
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
