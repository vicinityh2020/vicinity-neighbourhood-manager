'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, commonHelpers, searchAPIService, $stateParams, $window, Notification) {

// OnLoad functions &&  Initialize variables

// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.resultsOrganisations = [];
  $scope.resultsUsers = [];
  $scope.resultsItems = [];
  $scope.count = {organisation: 0, user: 0, item: 0};
  $scope.collapsed = {organisation: true, user: true, item: true};
  $scope.loaded = false;
  $scope.tempId = "";
  $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
  $scope.search = $stateParams.searchTerm;

  searchAPIService.searchOrganisation($scope.search)
    .then(searchUsers)
    .then(searchItems)
    .then(searchFinish)
    .catch(errorCallback);

    function searchUsers(response){
      $scope.resultsOrganisations = response.data.message;
      $scope.count.organisation = $scope.resultsOrganisations.length;
      $scope.loaded1 = true;
      return searchAPIService.searchUser($scope.search);
    }

    function searchItems(response){
      $scope.resultsUsers = response.data.message;
      $scope.count.user = $scope.resultsUsers.length;
      $scope.loaded2 = true;
      return searchAPIService.searchItem($scope.search);
    }

    function searchFinish(response){
      $scope.resultsItems = response.data.message.items;
      $scope.count.item = $scope.resultsItems.length;
      $scope.loaded3 = true;
      $scope.loaded = true;
    }

    function errorCallback(err){
        console.log(err);
        Notification.error("Server error");
    }

    $scope.collapseFlag = function(type){
      if(type === 'organisation') $scope.collapsed.organisation = !($scope.collapsed.organisation);
      if(type === 'user') $scope.collapsed.user = !($scope.collapsed.user);
      if(type === 'item') $scope.collapsed.item = !($scope.collapsed.item);
    };


  });
