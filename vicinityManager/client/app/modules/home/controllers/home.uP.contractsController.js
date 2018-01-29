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
  $scope.contractItems = [];
  $scope.noItems = false;
  $scope.loaded = false;
  $scope.detailShow = false;
  $scope.edit = false;
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
    if(!$scope.noItems){myContractDetails();}
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

  $scope.showDetails = function(id,edit){
    getOneContract(id);
    getOnlyId();
    $scope.edit = edit;
    itemsAPIService.getUserItems($scope.wholeContract.iotOwner.uid.id, $scope.wholeContract.iotOwner.cid.id._id, $scope.wholeContract.serviceProvider.cid.id._id, 'device')
    .then(function(response){
      $scope.alldevices = response.data.message.items;
      for(var i = 0; i < $scope.alldevices.length; i++){
        if($scope.contractItems.indexOf($scope.alldevices[i].id._id) !== -1){
            $scope.alldevices[i].status = true;
        } else {
          if(!edit){$scope.alldevices.splice(i,1);} // If not in contract show only for edit
        }
      }
      if(edit){
        $scope.mainTitle = "Edit Contract";
      } else {
        $scope.mainTitle = "Contract Details";
      }
      $scope.detailsShow = true;
    })
    .catch(function(error){
      Notification.error("Problem retrieving contract details: " + error);
    });
  };

  $scope.closeDetails = function(){
    $scope.detailsShow = false;
    $scope.wholeContract = {};
    $scope.contractItems = [];
    $scope.data = {};
    $scope.mainTitle = "My Contracts";
    $scope.edit = false;
    init();
  };

  $scope.editContract = function(id){
    $scope.data = {};
    $scope.data.cidService = {'extid': $scope.wholeContract.serviceProvider.cid.extid, 'id': $scope.wholeContract.serviceProvider.cid.id._id};
    $scope.data.uidService = $scope.wholeContract.serviceProvider.uid;
    $scope.data.oidService = [$scope.wholeContract.serviceProvider.items[0]];
    $scope.data.cidDevice = {'extid': $scope.wholeContract.iotOwner.cid.extid, 'id': $scope.wholeContract.iotOwner.cid.id._id};
    $scope.data.uidDevice = $scope.wholeContract.iotOwner.uid;
    $scope.data.readWrite = $scope.wholeContract.readWrite;
    var count = countDevices();
    if(count > 0){
      itemsAPIService.modifyContract($scope.wholeContract._id, $scope.data)
      .then(function(response){
        Notification.success('Contract sent for approval');
        $scope.closeDetails();
      })
      .catch(function(error){
        Notification.error('Problem processing the contract: ' + error);
      });
    } else {
      Notification.warning('Select some device to proceed');
    }
  };

  // Private Functions

  function getOnlyId(){
    for(var i = 0; i < $scope.wholeContract.iotOwner.items.length; i++){
      $scope.contractItems.push($scope.wholeContract.iotOwner.items[i].id._id);
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
      $scope.contracts[i].imServiceProv = $scope.contracts[i].serviceProvider.uid.id.toString() === $scope.uid.toString();
      if($scope.contracts[i].imServiceProv){
        $scope.contracts[i].agreed = $scope.contracts[i].serviceProvider.termsAndConditions;
      }else{
        $scope.contracts[i].agreed = $scope.contracts[i].iotOwner.termsAndConditions;
      }
    }
  }

  function countDevices(){
    var n = 0;
    $scope.data.oidDevices = [];
    for(var i = 0; i < $scope.alldevices.length; i++){
      if($scope.alldevices[i].status){
        n++;
        $scope.data.oidDevices.push({'id': $scope.alldevices[i].id._id, 'extid': $scope.alldevices[i].extid});
      }
    }
    return n;
  }

});
