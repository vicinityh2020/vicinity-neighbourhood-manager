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
        $scope.nodes = response.data.message.hasNodes;
        countItems();
      },
      function errorCallback(response){}
    );
  };

  myInit();

// ======== Main functions =========

    $scope.deleteNode = function(id){
      //TODO instead of pushing all adid except the one which needs to be removed, used the $pull method!!
      var newNodes = [];
      for(var i = 0; i < $scope.nodes.length; i++){
        if($scope.nodes[i]._id !== id){
          newNodes.push($scope.nodes[i]._id);
        }
      }
      var query = {hasNodes: newNodes};
      nodeAPIService.deleteOne($window.sessionStorage.companyAccountId,query) // Delete node ref in useraccounts
        .then(
          function successCallback(response){
            var query2 = {
              status : "deleted"
            };
            nodeAPIService.updateOne(id, query2) // upd status to removed of node in MONGO
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


    // $scope.createGroup = function(){  // Debug only -- TODO Remove
    //
    //   var payload = {
    //     name: $window.sessionStorage.companyAccountId,
    //     description: "Reagon"
    //   };
    //
    //   nodeAPIService.postResource('groups',payload)
    //     .then(
    //       function successCallback(response){
    //         Notification.success("Success");
    //       },
    //       errorCallback
    //     );
    // };


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
