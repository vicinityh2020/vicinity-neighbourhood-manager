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
function ($scope, $window, commonHelpers, $stateParams, $location, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();
  $scope.cid = { id: $window.sessionStorage.companyAccountId};
  $scope.uid = $window.sessionStorage.userAccountId;
  $scope.contracts = [];
  $scope.contractItems = [];
  $scope.noItems = false;
  $scope.loaded = false;
  $scope.detailShow = false;
  $scope.edit = false;
  $scope.mainTitle = "My Contracts";

  $scope.searchParam = $location.search(); // GET

  function init(){
    itemsAPIService.getContracts($stateParams.userAccountId)
      .then(successCallback, errorCallback);
  }

  init();

  // Callbacks

  function successCallback(response) {
    $scope.contracts = response.data.message;
    $scope.noItems = ($scope.contracts.length === 0);
    if(!$scope.noItems){myContractDetails();}
    $scope.loaded = true;
    if($scope.searchParam){
      $scope.showDetails($scope.searchParam.contractId, false);
    }
  }

  function errorCallback(error){
    Notification.error("Problem retrieving contracts: " + error);
  }

  // Buttons

  $scope.acceptContract = function(id){
    itemsAPIService.acceptContract(id)
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

  $scope.showDetails = function(id,edit){
    $location.search('contractId', id); // SET
    getOneContract(id);
    getOnlyId();
    $scope.edit = edit;

    itemsAPIService.getArrayOfItems($scope.contractItems)
    .then(function(response){
      $scope.alldevices = response.data.message;
      for(var i = 0; i < $scope.alldevices.length; i++){
        $scope.alldevices[i].isMine = ($scope.alldevices[i].uid.id.toString() === $scope.uid.toString());
        for(var j = 0; j < $scope.alldevices[i].hasContracts.length; j++){
          if($scope.alldevices[i].hasContracts[j].id.toString() === $scope.searchParam.contractId.toString() ){
              $scope.alldevices[i].status = $scope.alldevices[i].hasContracts[j].approved;
          }
          if(!$scope.alldevices[i].status){$scope.alldevices[i].status = false;} // If not approved show only for edit
        }
      }

      $scope.mainTitle = "Contract Details";
      $scope.detailsShow = true;
    })
    .catch(function(error){
      Notification.error("Problem retrieving contract details: " + error);
    });
  };

  $scope.closeDetails = function(){
    $location.search('contractId', null); // SET
    $scope.detailsShow = false;
    $scope.wholeContract = {};
    $scope.contractItems = [];
    $scope.data = {};
    $scope.mainTitle = "My Contracts";
    $scope.edit = false;
    init();
  };

  $scope.removeItem = function(){

  };

  $scope.addItem = function(){

  };

  // Private Functions

  function getOnlyId(){
    for(var i = 0; i < $scope.wholeContract.iotOwner.items.length; i++){
      $scope.contractItems.push($scope.wholeContract.iotOwner.items[i].id);
    }
  }

  function getOneContract(id){
    for(var i = 0; i < $scope.contracts.length; i++){
      if($scope.contracts[i]._id.toString() === id){
        $scope.wholeContract = $scope.contracts[i];
      }
    }
  }

  function myContractDetails(){
    for(var i = 0; i < $scope.contracts.length; i++){
      $scope.contracts[i].imServiceProv = $scope.contracts[i].foreignIot.uid[0].id.toString() === $scope.uid.toString();
      if($scope.contracts[i].imServiceProv){
        $scope.contracts[i].agreed = $scope.contracts[i].foreignIot.termsAndConditions;
      }else{
        $scope.contracts[i].agreed = $scope.contracts[i].iotOwner.termsAndConditions;
      }
    }
  }

});
