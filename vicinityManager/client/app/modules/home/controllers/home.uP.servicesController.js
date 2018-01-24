"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.controller('uPservicesController',
function ($scope, $window, commonHelpers, $stateParams, $location, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.cid = { id: $window.sessionStorage.companyAccountId};
  $scope.uid = $window.sessionStorage.userAccountId;
  $scope.things = [];
  $scope.noItems = false;
  $scope.loaded = false;

  function init(){
    itemsAPIService.getUserItems($stateParams.userAccountId, $stateParams.companyAccountId, $scope.cid.id, 'service')
      .then(successCallback, errorCallback);
  }

  init();

  // Callbacks

  function successCallback(response) {
    $scope.cid = response.data.message.cid;
    $scope.things = response.data.message.items;
    $scope.noItems = ($scope.things.length === 0);
    $scope.loaded = true;
  }

  function errorCallback(err){
    Notification.error("Problem retrieving services: " + err);
  }

});
