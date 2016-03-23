angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, searchAPIService, userAccountAPIService, $stateParams) {
    $scope.resultsList = [];
  
  
    $scope.searchFilter = function (result) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return !$stateParams.searchTerm || keyword.test(result.accountOf.name) || keyword.test(result.accountOf.occupation);
    };

    userAccountAPIService.getUserAccounts().success(function (response) {
      var results = response.message;
      $scope.resultsList = results;
    });
  });
