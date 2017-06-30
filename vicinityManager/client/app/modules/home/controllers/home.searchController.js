'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, searchAPIService, userAccountAPIService, $stateParams, $window, Notification) {

    $scope.resultsOrganisations = [];
    $scope.resultsUsers = [];
    $scope.resultsItems = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.search = $stateParams.searchTerm;

    searchAPIService.searchOrganisation($scope.search)
      .then(searchUsers,errorCallback)
      .then(searchFriends,errorCallback)
      .then(searchItems,errorCallback)
      .then(searchFinish,errorCallback);

      function searchUsers(response){
        $scope.resultsOrganisations = response.data.message;
        $scope.loaded1 = true;
        return searchAPIService.searchUser($scope.search);
      }

      function searchFriends(response){
        $scope.resultsUsers = response.data.message;
        $scope.loaded2 = true;
        return userAccountAPIService.getFriends($scope.activeCompanyID);
      }

      function searchItems(response){
        var payload = [];
        for(var elem in response.data.message){
          payload.push(response.data.message[elem]._id);
        }
        return searchAPIService.searchItem($scope.activeCompanyID, $scope.search, payload);
      }

      function searchFinish(response){
        $scope.resultsItems = response.data.message;
        $scope.loaded3 = true;
        $scope.loaded = true;
      }

      function errorCallback(err){
        Notification.error('Problem in the search: ' + err);
      }

  });
