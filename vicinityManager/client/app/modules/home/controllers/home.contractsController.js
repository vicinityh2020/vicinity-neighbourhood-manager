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
  $scope.offset = 0;
  $scope.limit = 10;
  $scope.filter = 0; // all
  $scope.contractsCaption = "User contracts";
  $scope.captionArray = ["", ": Only my services", ": Only contracted services", ": Only waiting approval"];

  $scope.searchParam = $location.search(); // GET

  function init(){
    itemsAPIService.getContracts($scope.uid, $scope.offset, $scope.limit, $scope.filter)
      .then(successCallback)
      .catch(function(error){
        console.log(error);
        Notification.error("Problem retrieving contracts");
      });
  }

  init();

  // Callbacks

  function successCallback(response) {
    if(response.data.message){
      var newContracts = parseContracts(response.data.message);
      if(newContracts.length !== 0){myContractDetails(newContracts);}
      $scope.contracts = $scope.contracts.concat(newContracts);
    }
      $scope.allItemsLoaded = response.data.message.length < $scope.limit;
      $scope.noItems = ($scope.contracts.length === 0);
      $scope.loaded = true;
      if($scope.searchParam.contractId !== undefined){
        $scope.showDetails($scope.searchParam.contractId, false);
      }
  }

  // Lazy loading

    // Get 10 more
      $scope.loadMore = function(){
          $scope.loaded = false;
          $scope.offset += 10;
          init();
      };

    // Reset selection and filter results
    // f = 0 -- all
    // f = 1 -- only my services
    // f = 2 -- only contracted services
    // f = 3 -- only waiting approval
      $scope.changeFilter = function(f){
          $scope.filter = f;
          reset();
          $scope.contractsCaption = "User contracts" + $scope.captionArray[f];
      };

      function reset(){
        $scope.contractsCaption = "User contracts" + $scope.captionArray[0];
        $scope.loaded = false;
        $scope.offset = 0;
        $scope.contracts = [];
        init();
      }

  // Buttons -- Functions accessed from UI

  $scope.acceptContract = function(ctid){
    itemsAPIService.acceptContract(ctid)
      .then(function(response){
        $scope.contracts = [];
        Notification.success("The contract was agreed!");
        reset();
      })
      .catch(function(error){
        console.log(error);
        Notification.error("Problem accepting contract");
      });
    };

  $scope.removeContract = function(ctid){
    itemsAPIService.removeContract(ctid)
      .then(function(response){
        $scope.contracts = [];
        Notification.success("The contract was cancelled!");
        $scope.closeDetails();
        reset();
      })
      .catch(function(error){
        console.log(error);
        Notification.error("Problem canceling contract");
      });
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
        reset();
        $scope.closeDetails();
      },
        function(error){
          $scope.moveThings = [];
          $scope.exchange = false;
          $scope.closeDetails();
          console.log(error);
          Notification.error("Problem moving contract"); }
      );
  };

  $scope.cancelMoveContract = function(ctid){
    $scope.moveThings = [];
    $scope.exchange = false;
  };


// Functions supporting contract management

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
      console.log(error);
      Notification.error("Problem getting suitable users for receiving contract");
    });
  };

// Remove one contract from array
  function removeCurrent(id){
    for(var i = 0, l = $scope.moveThings.length; i < l; i++){
      if($scope.moveThings[i]._id.toString() === id.toString()){
        $scope.moveThings.splice(i,1);
        return true;
      }
    }
  }

// Build details view
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
      console.log(error);
      Notification.error("Problem retrieving contract details");
    });
  };

  // Close details view
  $scope.closeDetails = function(){
    $location.search('contractId', null); // SET
    $scope.detailsShow = false;
    $scope.wholeContract = {};
    $scope.data = {};
    $scope.mainTitle = "My Contracts";
    reset();
  };

// Disable one device only
  $scope.disableItem = function(thing){
    itemsAPIService.ctDisableItem({oid:{ extid: thing.oid, id: thing._id}, ct: { extid: $scope.wholeContract.ctid, id: $scope.wholeContract._id}, uid: thing.uid})
    .then(function (response) {
      if(response.error){
        Notification.error('Problem disabling item: ' + response.message);
      } else { reset(); }
    })
    .catch(function(err){
      console.log(err);
      Notification.error('Problem disabling item');
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
        reset();
      }
    })
    .catch(function(err){
      console.log(err);
      Notification.error('Problem removing item');
    });
  };

// Enable one device only
  $scope.enableItem = function(thing){
    itemsAPIService.ctEnableItem({oid: thing.oid, ct: { extid: $scope.wholeContract.ctid, id: $scope.wholeContract._id}, uid: thing.uid})
    .then(function (response) {
      if(response.error){
        Notification.error('Problem enabling item: ' + response.message);
      } else { reset(); }
    })
    .catch(function(err){
      console.log(err);
      Notification.error('Problem enabling item');
    });
  };

  function getOneContract(id){
    for(var i = 0; i < $scope.contracts.length; i++){
      if($scope.contracts[i]._id.toString() === id){
        $scope.wholeContract = $scope.contracts[i];
        // TODO $scope.wholeContract.serviceStatus ...
      }
    }
  }

  // Only if there are contracts to avoid undefined exceptions
  function myContractDetails(array){
    var cts = [];
    for(var i = 0, l = array.length; i < l; i++){
      cts.push(array[i]);
      cts[i].imServiceProv = cts[i].foreignIot.uid[0].id.toString() === $scope.uid.toString();
      cts[i].serviceAgreed = cts[i].foreignIot.termsAndConditions;
      cts[i].infrastructureAgreed = cts[i].iotOwner.termsAndConditions;
      cts[i].numberOfItems = cts[i].iotOwner.items.length;
    }
    return cts;
  }

  // Add content to the contract array items
  function parseContracts(array){
    var cts = [];
    for(var i = 0, l = array.length; i < l; i++){
      if(array[i].hasContracts.id.status !== 'deleted'){
        cts.push(array[i].hasContracts.id);
        cts[i].imAdmin = array[i].hasContracts.imAdmin;
        cts[i].imForeign = array[i].hasContracts.imForeign;
        cts[i].active = array[i].hasContracts.approved;
        if(array[i].hasContracts.inactive) cts[i].inactiveItems = array[i].hasContracts.inactive.length > 0;
      }
    }
    return cts;
  }

  // Other functions

  function getOnlyId(){
    var array = [];
    for(var i = 0; i < $scope.wholeContract.iotOwner.items.length; i++){
      array.push($scope.wholeContract.iotOwner.items[i].id);
    }
    return array;
  }

  // Support sorting
  $scope.orderByMe = function(x) {
    if($scope.myOrderBy === x){
      $scope.rev=!($scope.rev);
    }
    $scope.myOrderBy = x;
  };

  // Support sorting
  $scope.onSort = function(order){
    $scope.rev = order;
  };

});
