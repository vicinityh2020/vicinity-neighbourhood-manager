'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('allEntities', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, $stateParams, $window) {

    // Ensure scroll on top onLoad
        $window.scrollTo(0, 0);

    // Variables
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    // Get initial resources
    userAccountAPIService.getUserAccounts()
      .then(
        function successCallback(response){
          $scope.resultsList = response.data.message;
          getFriends();
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );

      function getFriends(){
        var i = 0;
        for(i = 0; i < $scope.resultsList.length; i++){
          if($scope.resultsList[i]._id === $window.sessionStorage.companyAccountId){
            $scope.myFriends = $scope.resultsList[i].knows;
            $scope.resultsList.splice(i,1);
          }
        }
      }

  });
