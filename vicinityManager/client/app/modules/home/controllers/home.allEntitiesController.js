angular.module('VicinityManagerApp.controllers').
  controller('allEntities', function ($scope, searchAPIService, userAccountAPIService, $stateParams, $window) {
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;

    // ====== Triggers window resize to avoid bug =======
        $(window).trigger('resize');
          $interval(waitTillLoad, 100, 1);
          function waitTillLoad(){
            $(window).trigger('resize');
          }

    // $scope.searchFilter = function (result) {
    //   var keyword = new RegExp($stateParams.searchTerm, 'i');
    //
    //   return !$stateParams.searchTerm || keyword.test(result.organisation) ;   // || keyword.test(result.accountOf.occupation)
    // };

    // userAccountAPIService.getUserAccounts().success(function (response) {
    //   var results = response.message;
    //   $scope.resultsList = results;
    //   $scope.loaded = true;
    // });

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
