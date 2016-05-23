angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, searchAPIService, userAccountAPIService, $stateParams) {
    $scope.resultsList = [];
    $scope.loaded = false;


    $scope.searchFilter = function (result) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return !$stateParams.searchTerm || keyword.test(result.organisation) ;   // || keyword.test(result.accountOf.occupation)
    };

    userAccountAPIService.getUserAccounts().success(function (response) {
      var results = response.message;
      $scope.resultsList = results;
      $scope.loaded = true;
    });
  });
