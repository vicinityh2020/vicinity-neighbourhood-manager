'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cTrequestService',
function ($scope, $stateParams, $state, $window, commonHelpers, itemsAPIService, Notification) {
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

  initData();

  function initData(){
    // Get user items returns only items that I can chare with the other party
    itemsAPIService.getUserItems($scope.requester.id, $scope.requester.cid)
      .then(
        function (response){
          $scope.device.cid = response.data.message.cid;
          $scope.things = response.data.message.items;
          $scope.setCaption();
          return itemsAPIService.getItemWithAdd($scope.owner.oid);
        })
        .then(function(response){
          $scope.aux = response.data.message[0];
          $scope.service.cid = $scope.aux.cid;
          $scope.service.uid = $scope.aux.uid;
          $scope.service.oid = { 'id': $scope.aux._id, 'extid': $scope.aux.oid};
          $scope.service.name = $scope.aux.name;
          $scope.service.accessLevel = $scope.aux.accessLevel;
          $scope.service.myFriend = $scope.aux.imFriend ? 'Yes' : 'No';
          var aux = ["Private", "Partners with Data Under Request", "Public with Data Under Request"];
          $scope.service.accessLevelCaption = aux[Number($scope.service.accessLevel)];
          $scope.loaded = true;
        })
        .catch(function(error){
          Notification.error(error);
        });
    }

    // Functions

    $scope.processContract = function(){
      $scope.data = {};
      $scope.data.cidService = $scope.service.cid;
      $scope.data.uidService = $scope.service.uid;
      $scope.data.oidService = [$scope.service.oid];
      $scope.data.cidDevice = $scope.device.cid;
      $scope.data.uidDevice = {'id': $scope.requester.id, 'extid': $scope.requester.extid };
      $scope.data.readWrite = $scope.readWrite;
      var count = $scope.countDevices();
      if(count > 0){
        itemsAPIService.postContract($scope.data)
        .then(function(response){
          Notification.success('Contract sent for approval');
          $state.go("root.main.allServices");
        })
        .catch(function(error){
          Notification.error('Problem processing the contract: ' + error);
        });
      } else {
        Notification.warning('Select some device to proceed');
      }
    };

    $scope.countDevices = function(){
      var n = 0;
      $scope.data.oidDevices = [];
      for(var i = 0; i < $scope.things.length; i++){
        if($scope.things[i].id.status){
          n++;
          $scope.data.oidDevices.push({'id': $scope.things[i].id._id, 'extid': $scope.things[i].extid});
        }
      }
      return n;
    };

    $scope.setCaption = function(){
      for(var i = 0; i < $scope.things.length; i++){
      switch ($scope.things[i].id.accessLevel) {
          case 0:
              $scope.things[i].id.accessLevelCaption = "Private";
              break;
          case 1:
              $scope.things[i].id.accessLevelCaption = "Under request for friends";
              break;
          case 2:
              $scope.things[i].id.accessLevelCaption = "Under request for everyone";
              break;
          default:
              $scope.things[i].id.accessLevelCaption = "Private";
          }
        }

    };

});
