'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('allEntities', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, $stateParams, $window) {

    // Ensure scroll on top onLoad
        $window.scrollTo(0, 0);

    // Variables
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.filterNumber = 0;
    $scope.entitiesCaption = "All organisations";
    $scope.myFriends = [];

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    // Get initial resources
    function init(){
      userAccountAPIService.getUserAccounts($scope.activeCompanyID, $scope.filterNumber)
        .then(
          function successCallback(response){
            $scope.resultsList = response.data.message;
            getFriends();
            $scope.loaded = true;
          },
          function errorCallback(response){
          }
        );
      }

    init();

      // Private functions

      function getFriends(){
        var i = 0;
        for(i = 0; i < $scope.resultsList.length; i++){
          if($scope.resultsList[i]._id.toString() === $window.sessionStorage.companyAccountId){
            $scope.getIds($scope.resultsList[i].knows);
            $scope.resultsList.splice(i,1);
          }
        }
      }

      $scope.filterOrganisations = function(n){
        $scope.filterNumber = n;
        if(n === 0){ $scope.entitiesCaption = "All organisations"; }
        else if(n === 1){ $scope.entitiesCaption = "My partners"; }
        else{ $scope.entitiesCaption = "Other organisations"; }
        init();
      };

      $scope.getIds = function(array){
        for(var i = 0; i < array.length; i++){
          $scope.myFriends.push(array[i].id);
        }
      };

  });
