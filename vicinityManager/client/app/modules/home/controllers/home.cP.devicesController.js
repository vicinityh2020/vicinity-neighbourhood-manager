"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.controller('cPdevicesController',
function ($scope, $window, commonHelpers, $stateParams, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.cid = $window.sessionStorage.companyAccountId;
  $scope.devices = [];
  $scope.allItemsLoaded = false;
  $scope.loadedPage = false;
  $scope.loaded = false;
  $scope.offset = 0;

  function init(){
    itemsAPIService.getMyItems($stateParams.companyAccountId,'device', $scope.offset, $scope.cid)
      .then(successCallback)
      .catch(errorCallback);
  }

  init();

  // Trigers load of more items

  $scope.loadMore = function(){
      $scope.loaded = false;
      $scope.offset += 12;
      init();
  };

  // Callbacks

  function successCallback(response) {
    for(var i = 0; i < response.data.message.length; i++){
        $scope.devices.push(response.data.message[i]);
    }
    $scope.noItems = ($scope.devices.length === 0);
    $scope.allItemsLoaded = response.data.message.length < 12;
    $scope.loaded = true;
    $scope.loadedPage = true;
  }

  function errorCallback(err){
    console.log(err);
    Notification.error("Problem retrieving devices");
  }

});
