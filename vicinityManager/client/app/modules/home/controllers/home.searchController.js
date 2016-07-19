angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, searchAPIService, userAccountAPIService, userAPIService, $stateParams, $window) {
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.search = $stateParams.searchTerm;


    $scope.searchFilter = function (result) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return $stateParams.searchTerm && keyword.test(result.organisation) ;   // || keyword.test(result.accountOf.occupation)
    };

    // var promise = $timeout(emptySearch, 1000);
    //
    // $scope.$on('$locationChangeStart', function(){
    //     $timeout.cancel(promise);
    // });
    //
    // function emptySearch(){
    //   $stateParams.searchTerm = "";
    // }

    userAccountAPIService.getUserAccounts().success(function (response) {
      var results = response.message;
      $scope.resultsList = results;
      $scope.loaded = true;
    });

    $scope.searchFilter2 = function (result2) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return $stateParams.searchTerm && keyword.test(result2.name) ;   // || keyword.test(result.accountOf.occupation)
    };

    userAPIService.getAll().success(function (response) {   //users not userAccounts
      var results2 = response.message;
      $scope.resultsList2 = results2;
      $scope.loaded = true;
    });


  });
