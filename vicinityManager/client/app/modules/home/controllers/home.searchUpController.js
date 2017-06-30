'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchUpController', function ($scope, $stateParams, $window) {
    // $scope.resultsList = [];
    // $scope.loaded = false;
    // $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    // $scope.search = $stateParams.searchTerm;

    // Clear old search when changing location

    $scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl){
        // console.log('oldURL: ' + oldUrl + ' newUrl: ' + newUrl );
        if (oldUrl.startsWith("http://localhost:8000/app/#/search") && !(newUrl.startsWith("http://localhost:8000/app/#/search"))){
          $scope.searchTerm = "";
        }
    });
  });
