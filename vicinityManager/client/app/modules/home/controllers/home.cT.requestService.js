'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cTrequestService',
function ($scope, $stateParams, $state, $window, $q, commonHelpers, itemsAPIService, Notification) {
  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.requester = {
    'id': $window.sessionStorage.userAccountId,
    'extid': $window.sessionStorage.username,
    'cid': $window.sessionStorage.companyAccountId
  };
  $scope.owner = {
    'oid': $stateParams.serviceId,
    'cid': $stateParams.companyAccountId
  };
  // $scope.step = 1; //TODO Consider adding steps
  $scope.device = {};
  $scope.service = {};
  $scope.loaded = false;
  $scope.terms = false;
  $scope.readWrite = false;
  $scope.usersIn = {}; // Stores the device users, avoid storing non unique users

  initData();

  function initData(){
    // Get user items returns only items that I can chare with the other party
    itemsAPIService.getMyContractItems($scope.owner.cid, $scope.owner.oid)
      .then(
        function (response){
          return checkIfItemsToShare(response);
        })
        .then(function(response){
          var auxcid = response.data.message[0].cid;
          $scope.device.cid = { 'id': auxcid.id._id, 'extid': auxcid.extid, 'name': auxcid.id.name};
          $scope.things = response.data.message;
          $scope.setCaption();
          return itemsAPIService.getItemWithAdd($scope.owner.oid);
        })
        .then(function(response){
          $scope.aux = response.data.message[0];
          $scope.service.cid = { 'id': $scope.aux.cid.id._id, 'extid': $scope.aux.cid.extid, 'name': $scope.aux.cid.id.name};
          $scope.service.uid = $scope.aux.uid;
          $scope.service.oid = { 'id': $scope.aux._id, 'extid': $scope.aux.oid, 'name': $scope.aux.name};
          $scope.service.name = $scope.aux.name;
          $scope.service.accessLevel = $scope.aux.accessLevel;
          $scope.service.myFriend = $scope.aux.imFriend ? 'Yes' : 'No';
          var aux = ["Private", "Partners with Data Under Request", "Public with Data Under Request"];
          $scope.service.accessLevelCaption = aux[Number($scope.service.accessLevel)];
          $scope.loaded = true;
        })
        .catch(function(error){
          if(error === "No items"){
            Notification.warning("You do not have items to share with this service!!");
            $state.go("root.main.allServices");
          } else {
            console.log(error);
            Notification.error("Server error");
            $state.go("root.main.allServices");
          }
        });
    }

    // Functions

    $scope.processContract = function(){
      $scope.data = {};
      $scope.data.cidService = $scope.service.cid;
      $scope.data.uidsService = [$scope.service.uid];
      $scope.data.contractingUser = $scope.service.uid;
      $scope.data.oidsService = [$scope.service.oid];
      $scope.data.cidDevice = $scope.device.cid;
      $scope.data.uidsDevice = [{'id': $scope.requester.id, 'extid': $scope.requester.extid }];
      $scope.usersIn[$scope.requester.extid] = 1;
      $scope.data.readWrite = $scope.readWrite;
      var count = $scope.countDevices();
      if(count > 0){
        itemsAPIService.postContract($scope.data)
        .then(function(response){
          Notification.success('Contract sent for approval');
          $state.go("root.main.allServices");
        })
        .catch(function(error){
          if(error.status === 400){
            Notification.warning('A contract with the same items already exists!');
            $state.go("root.main.allServices");
          } else {
            console.log(error);
            Notification.error('Problem processing the contract');
            $state.go("root.main.allServices");
          }
        });
      } else {
        Notification.warning('Select some device to proceed');
      }
    };

    $scope.countDevices = function(){
      var n = 0;
      try{
        $scope.data.oidsDevice = [];
        for(var i = 0; i < $scope.things.length; i++){
          if($scope.things[i].status){
            n++;
            $scope.data.oidsDevice.push({ 'id': $scope.things[i]._id, 'extid': $scope.things[i].oid, 'name': $scope.things[i].name });
            if(!$scope.usersIn.hasOwnProperty($scope.things[i].uid.extid)){
              $scope.usersIn[$scope.things[i].uid.extid] = 1;
              $scope.data.uidsDevice.push({ 'id': $scope.things[i].uid.id, 'extid': $scope.things[i].uid.extid });
            }
          }
        }
        return n;
      } catch(err) {
        console.log(err);
        Notification.warning("It was not possible to find any items for the contract");
        n = 0;
        return n;
      }
    };

    $scope.setCaption = function(){
      for(var i = 0; i < $scope.things.length; i++){
      switch ($scope.things[i].accessLevel) {
          case 0:
              $scope.things[i].accessLevelCaption = "Private";
              break;
          case 1:
              $scope.things[i].accessLevelCaption = "Under request for friends";
              break;
          case 2:
              $scope.things[i].accessLevelCaption = "Under request for everyone";
              break;
          default:
              $scope.things[i].accessLevelCaption = "Private";
          }
        }
    };

    $scope.orderByMe = function(x) {
      if($scope.myOrderBy === x){
        $scope.rev=!($scope.rev);
      }
      $scope.myOrderBy = x;
    };

    $scope.onSort = function(order){
      $scope.rev = order;
    };

    function checkIfItemsToShare(msg){
      return $q(function(resolve, reject) {
          if(msg.data.message.length > 0){
            resolve(msg);
          } else {
            reject("No items");
          }
        }
      );
    }

});
