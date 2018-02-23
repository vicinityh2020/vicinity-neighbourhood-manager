'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, commonHelpers, searchAPIService, $stateParams, $window, Notification) {

// OnLoad functions &&  Initialize variables

// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.resultsOrganisations = [];
  $scope.resultsUsers = [];
  $scope.resultsItems = [];
  $scope.loaded = false;
  $scope.tempId = "";
  $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
  $scope.search = $stateParams.searchTerm;


  searchAPIService.searchOrganisation($scope.search)
    .then(searchUsers,errorCallback)
    .then(searchItems,errorCallback)
    .then(searchFinish,errorCallback);

    function searchUsers(response){
      $scope.resultsOrganisations = response.data.message;
      $scope.loaded1 = true;
      return searchAPIService.searchUser($scope.search);
    }

    function searchItems(response){
      $scope.resultsUsers = response.data.message;
      $scope.loaded2 = true;
      return searchAPIService.searchItem($scope.search);
    }

    function searchFinish(response){
      $scope.resultsItems = response.data.message;
      $scope.loaded3 = true;
      $scope.loaded = true;
    }

    function errorCallback(err){
      Notification.error('Problem with the search: ' + err);
    }

  });
