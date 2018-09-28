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
function ($scope, $window, commonHelpers, $stateParams, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.cid = { id: $window.sessionStorage.companyAccountId};
  $scope.uid = $window.sessionStorage.userAccountId;
  $scope.things = [];
  $scope.noItems = false;
  $scope.loaded = false;

  function init(){
    itemsAPIService.getUserItems($stateParams.userAccountId, $stateParams.companyAccountId, 'service')
    .then(successCallback)
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });
  }

  init();

  // Callbacks

  function successCallback(response) {
    if(response.data.error){
      Notification.error('Error retrieving devices');
      $scope.loaded = true;
      $scope.noItems = true;
    } else {
      $scope.cid = response.data.message.cid;
      $scope.things = response.data.message.items;
      $scope.noItems = ($scope.things.length === 0);
      $scope.loaded = true;
    }
  }
});
