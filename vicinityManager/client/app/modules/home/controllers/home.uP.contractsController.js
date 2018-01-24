"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.controller('uPcontractsController',
function ($scope, $window, commonHelpers, $stateParams, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();
  $scope.cid = { id: $window.sessionStorage.companyAccountId};
  $scope.uid = $window.sessionStorage.userAccountId;
  $scope.contracts = [];
  $scope.noItems = false;
  $scope.loaded = false;
  $scope.detailShow = false;
  $scope.mainTitle = "My Contracts";

  function init(){
    itemsAPIService.getContracts($stateParams.userAccountId)
      .then(successCallback, errorCallback);
  }

  init();

  // Callbacks

  function successCallback(response) {
    $scope.contracts = response.data.message;
    $scope.noItems = ($scope.contracts.length === 0);
    if(!$scope.noItems){$scope.myContractDetails()};
    $scope.loaded = true;
  }

  function errorCallback(error){
    Notification.error("Problem retrieving contracts: " + error);
  }

  // Buttons

  $scope.acceptContract = function(id){
    itemsAPIService.acceptContract(id, {})
      .then(function(response){
        Notification.success("The contract was agreed!");
        init();
      },
        function(error){ Notification.error("Problem accepting contract: " + error); }
      );
    };

  $scope.removeContract = function(id){
    itemsAPIService.removeContract(id)
      .then(function(response){
        Notification.success("The contract was cancelled!");
        init();
      },
        function(error){ Notification.error("Problem canceling contract: " + error); }
      );
  };

  $scope.showDetails = function(id){
    itemsAPIService.getContractDetails(id)
      .then(function(response){
        $scope.wholeContract = response.data.message;
        $scope.detailsShow = true;
        $scope.mainTitle = "Contract Details";
      },
        function(error){ Notification.error("Problem retrieving contract details: " + error); }
      );
  };

  $scope.closeDetails = function(){
    $scope.detailsShow = false;
    $scope.mainTitle = "My Contracts";
  };

  $scope.editContract = function(id){

  };

  // Functions

  $scope.myContractDetails = function(){
    for(var i = 0; i < $scope.contracts.length; i++){
      $scope.contracts[i].imServiceProv = $scope.contracts[i].serviceProvider.uid.id.toString() === $scope.uid.toString();
      if($scope.contracts[i].imServiceProv){
        $scope.contracts[i].agreed = $scope.contracts[i].serviceProvider.termsAndConditions;
      }else{
        $scope.contracts[i].agreed = $scope.contracts[i].iotOwner.termsAndConditions;
      }
    }
  };

});
