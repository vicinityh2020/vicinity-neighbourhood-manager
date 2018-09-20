"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Filters the items based on the following rules:
- If it is my company profile I see all the items which belong to me
- If it is other company profile I see all its items which:
  . are flagged as public
  . if I am partner of the company, also items flagged for friends
*/
.controller('contractsController',
function ($scope, $window, commonHelpers, $location, itemsAPIService,  Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();
  $scope.cid = { id: $window.sessionStorage.companyAccountId};
  $scope.uid = $window.sessionStorage.userAccountId;
  $scope.contracts = [];
  $scope.wholeContract = {};
  $scope.noItems = false;
  $scope.loaded = false;
  $scope.exchange = false;
  $scope.mainTitle = "My Contracts";

  $scope.searchParam = $location.search(); // GET

  function init(){
    itemsAPIService.getContracts($scope.uid)
      .then(successCallback)
      .catch(errorCallback);
  }

  init();

  // Callbacks

  function successCallback(response) {
    $scope.contracts = [];
    $scope.contracts = parseContracts(response.data.message);
    $scope.noItems = ($scope.contracts.length === 0);
    if(!$scope.noItems){myContractDetails();}
    $scope.loaded = true;
    if($scope.searchParam.contractId !== undefined){
      $scope.showDetails($scope.searchParam.contractId, false);
    }
  }

  function errorCallback(error){
    Notification.error("Problem retrieving contracts: " + error);
  }

  // Buttons

  $scope.acceptContract = function(ctid){
    itemsAPIService.acceptContract(ctid)
      .then(function(response){
        $scope.contracts = [];
        Notification.success("The contract was agreed!");
        init();
      },
        function(error){ Notification.error("Problem accepting contract: " + error); }
      );
    };

  $scope.removeContract = function(ctid){
    itemsAPIService.removeContract(ctid)
      .then(function(response){
        $scope.contracts = [];
        Notification.success("The contract was cancelled!");
        $scope.closeDetails();
        init();
      },
        function(error){ Notification.error("Problem canceling contract: " + error); }
      );
  };

  $scope.moveContract = function(ctid){
    $scope.getAvailableUsers();
  };

  $scope.saveMoveContract = function(){
    var newThing = JSON.parse($('select#editMoveName').val());
    var ctid = {
      id: $scope.wholeContract._id,
      ctid: $scope.wholeContract.oid
    };
    var uidNew = {
      id: newThing._id,
      extid: newThing.email,
      name: newThing.name
    };
    var uidOld = {
      id: $scope.uid
      // extid: $scope.item.uid.extid,
      // name: $scope.item.uid.name
    };
    itemsAPIService.moveContract({ctid: ctid, uidNew: uidNew, uidOld: uidOld})
      .then(function(response){
        $scope.moveThings = [];
        $scope.exchange = false;
        Notification.success("The contract owner was changed!");
        init();
        $scope.closeDetails();
      },
        function(error){
          $scope.moveThings = [];
          $scope.exchange = false;
          $scope.closeDetails();
          Notification.error("Problem canceling contract: " + error); }
      );
  };

  $scope.cancelMoveContract = function(ctid){
    $scope.moveThings = [];
    $scope.exchange = false;
  };


// Other functions

  $scope.getAvailableUsers = function(){
    $scope.moveThings = [];
    itemsAPIService.getMoveUsers('contract')
    .then(function(response){
      if($scope.exchange){
        $scope.moveThings = [];
        $scope.exchange = false;
      } else if(response.data.message.length > 0){
        $scope.moveThings = response.data.message;
        $scope.exchange = true;
        removeCurrent($scope.uid);
      } else {
        Notification.warning("There aren't available users...");
      }
    })
    .catch(function(error){
      Notification.error(error);
    });
  };

  function removeCurrent(id){
    for(var i = 0, l = $scope.moveThings.length; i < l; i++){
      if($scope.moveThings[i]._id.toString() === id.toString()){
        $scope.moveThings.splice(i,1);
        return true;
      }
    }
  }

  $scope.showDetails = function(id){
    $location.search('contractId', id); // SET
    getOneContract(id);
    var contractItems = getOnlyId();
    itemsAPIService.getArrayOfItems(contractItems)
    .then(function(response){
      $scope.alldevices = response.data.message;
      for(var i = 0; i < $scope.alldevices.length; i++){
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
    $scope.data = {};
    $scope.mainTitle = "My Contracts";
    init();
  };

// Disable one device only
  $scope.disableItem = function(thing){
    itemsAPIService.ctDisableItem({oid:{ extid: thing.oid, id: thing._id}, ct: { extid: $scope.wholeContract.ctid, id: $scope.wholeContract._id}, uid: thing.uid})
    .then(function (response) {
      if(response.error){
        Notification.error('Problem disabling item: ' + response.message);
      } else { init(); }
    })
    .catch(function(err){
      Notification.error('Problem disabling item: ' + err);
    });
  };

// Remove one device only
  $scope.removeItem = function(thing){
    itemsAPIService.ctRemoveItem({oid: thing.oid, ct: { extid: $scope.wholeContract.ctid, id: $scope.wholeContract._id}, uid: thing.uid})
    .then(function (response) {
      if(response.error){
        Notification.error('Problem removing item: ' + response.message);
      } else {
        if($scope.alldevices.length === 1) $scope.closeDetails();
        init();
      }
    })
    .catch(function(err){
      Notification.error('Problem disabling item: ' + err);
    });
  };

// Enable one device only
  $scope.enableItem = function(thing){
    itemsAPIService.ctEnableItem({oid: thing.oid, ct: { extid: $scope.wholeContract.ctid, id: $scope.wholeContract._id}, uid: thing.uid})
    .then(function (response) {
      if(response.error){
        Notification.error('Problem enabling item: ' + response.message);
      } else { init(); }
    })
    .catch(function(err){
      Notification.error('Problem disabling item: ' + err);
    });
  };

  // Private Functions

  function getOnlyId(){
    var array = [];
    for(var i = 0; i < $scope.wholeContract.iotOwner.items.length; i++){
      array.push($scope.wholeContract.iotOwner.items[i].id);
    }
    return array;
  }

  function getOneContract(id){
    for(var i = 0; i < $scope.contracts.length; i++){
      if($scope.contracts[i]._id.toString() === id){
        $scope.wholeContract = $scope.contracts[i];
        // TODO $scope.wholeContract.serviceStatus ...
      }
    }
  }

  // Only if there are contracts to avoid undefined exceptions
  function myContractDetails(){
    for(var i = 0; i < $scope.contracts.length; i++){
      $scope.contracts[i].imServiceProv = $scope.contracts[i].foreignIot.uid[0].id.toString() === $scope.uid.toString();
      $scope.contracts[i].serviceAgreed = $scope.contracts[i].foreignIot.termsAndConditions;
      $scope.contracts[i].infrastructureAgreed = $scope.contracts[i].iotOwner.termsAndConditions;
      $scope.contracts[i].numberOfItems = $scope.contracts[i].iotOwner.items.length;
    }
  }

  function parseContracts(array){
    var cts = [];
    for(var i = 0; i < array.length; i++){
      if(array[i].id.status !== 'deleted'){
        cts.push(array[i].id);
        cts[i].imAdmin = array[i].imAdmin;
        cts[i].imForeign = array[i].imForeign;
        cts[i].active = array[i].approved;
        cts[i].inactiveItems = array[i].inactive.length > 0;
      }
    }
    return cts;
  }

  $scope.orderByMe = function(x) {
    if($scope.myOrderBy === x){
      $scope.rev=!($scope.rev);
    }
    $scope.myOrderBy = x;
  };

  $scope.onSort = function(order){
    $scope.rev = order;
  };

});
