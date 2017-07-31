'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('myNodesController',
  function ($scope,
            $state,
            $stateParams,
            $window,
            $location,
            $http,
            nodeAPIService,
            Notification) {

// ======== Set initial variables ==========

  $scope.rev = false;
  $scope.myOrderBy = 'name';

  var myInit = function(){
  nodeAPIService.getAll($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.nodes = response.data.message;
        countItems();
      },
      function errorCallback(response){}
    );
  };

  myInit();

// ======== Main functions =========

  $scope.deleteNode = function(id){
    var nodeId = {adid: id};
    nodeAPIService.pullIdFromOrganisation($window.sessionStorage.companyAccountId,nodeId) // Delete node ref in useraccounts
      .then(
        function successCallback(response){
          nodeAPIService.updateOne(id, {status : "deleted"}) // upd status to removed of node in MONGO
            .then(
              function successCallback(response){
                Notification.success("Node successfully removed!!");
                myInit();
              },
              errorCallback
            );
          },
          errorCallback
        );
      };

    function errorCallback(err){
      Notification.error("Something went wrong: " + err);
    }

    function countItems(){
      for(var i = 0; i < $scope.nodes.length; i++){
        $scope.nodes[i].numItems = $scope.nodes[i].hasItems.length;
      }
    }

// ==== Navigation functions =====

    $scope.goToEdit = function(i){
        $state.go("root.main.nodeDetail",{nodeId: i});
    };

    $scope.orderByMe = function(x) {
      if($scope.myOrderBy === x){
        $scope.rev=!($scope.rev);
      }
      $scope.myOrderBy = x;
    };

});
