'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('allEntities', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, $stateParams, $window, Notification) {

    // Ensure scroll on top onLoad
        $window.scrollTo(0, 0);

    // Variables
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.offset = 0;
    $scope.filterNumber = 0;
    $scope.entitiesCaption = "All organisations";
    $scope.myFriends = [];
    $scope.allItemsLoaded = false;

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    // Get initial resources
    function init(){
      userAccountAPIService.getUserAccounts($scope.activeCompanyID, $scope.filterNumber, $scope.offset)
      .then(function(response){
          for(var i = 0; i < response.data.message.length; i++){
              $scope.resultsList.push(response.data.message[i]);
          }
          getFriends();
          $scope.allItemsLoaded = response.data.message.length < 12;
          $scope.loaded = true;
        })
        .catch(function(err){
          console.log(err);
          Notification.error("Server error");
        });
      }

    init();

      // Private functions

      function getFriends(){
        try{
          var i = 0, l = $scope.resultsList.length, flag = false;
          while(!flag && i < l){
            if($scope.resultsList[i]._id.toString() === $window.sessionStorage.companyAccountId){
              $scope.getIds($scope.resultsList[i].knows);
              $scope.resultsList.splice(i,1);
              flag = true;
            }
            i++;
          }
        } catch(err){
          console.log(err);
          Notification.warning("Error fetching friends");
        }
      }

      $scope.filterOrganisations = function(n){
        try{
          $scope.filterNumber = n;
          if(n === 0){ $scope.entitiesCaption = "All organisations"; }
          else if(n === 1){ $scope.entitiesCaption = "My partners"; }
          else{ $scope.entitiesCaption = "Other organisations"; }
          $scope.loaded = false;
          $scope.resultsList = [];
          $scope.offset = 0;
          init();
        } catch(err){
          init();
          console.log(err);
          Notification.warning("Error filtering organisations");
        }
      };

      $scope.getIds = function(array){
        for(var i = 0; i < array.length; i++){
          $scope.myFriends.push(array[i].id);
        }
      };

      // Trigers load of more items

      $scope.loadMore = function(){
          $scope.loaded = false;
          $scope.offset += 12;
          init();
      };

  });
