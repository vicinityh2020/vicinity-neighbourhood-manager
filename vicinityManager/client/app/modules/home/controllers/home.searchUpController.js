'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchUpController', function ($scope, $stateParams, $window, configuration) {

    // Clear old search when changing location
    $scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl){
        if (oldUrl.startsWith(configuration.baseHref + "/#/search") && !(newUrl.startsWith(configuration.baseHref + "/#/search"))){
          $scope.searchTerm = "";
        }
    });
  });
