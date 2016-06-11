angular.module('VicinityManagerApp.controllers').
  controller('searchUpController', function ($scope, $timeout, searchAPIService, userAccountAPIService, $stateParams, $window) {
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.search = $stateParams.searchTerm;

    // var promise = $timeout(emptySearch, 2000);

    $scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl){
        console.log('oldURL: ' + oldUrl + ' newUrl: ' + newUrl );
        if (oldUrl.startsWith("http://localhost:8000/app/#/search") && !(newUrl.startsWith("http://localhost:8000/app/#/search"))){
          $scope.searchTerm = "";
        };
    });

  });
