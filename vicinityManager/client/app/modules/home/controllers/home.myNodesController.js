'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('myNodesController',
  function ($scope, $state, $window, commonHelpers, nodeAPIService, Notification) {

// ======== Set initial variables ==========

// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Ensure scroll on top onLoad
  $window.scrollTo(0, 0);

  $scope.imMobile = Number($window.innerWidth) < 768;
  $(window).on('resize',function(){
    $scope.imMobile = Number($window.innerWidth) < 768;
  });

  $scope.rev = false;
  $scope.myOrderBy = 'name';
  $scope.loadedPage = false;

  var myInit = function(){
  nodeAPIService.getAll($window.sessionStorage.companyAccountId)
  .then(function(response){
      $scope.nodes = response.data.message;
      try{
        countItems();
        $scope.loadedPage = true;
      } catch(err) {
        console.log(err);
        Notification.warning("Node items could not be counted");
        $scope.loadedPage = true;
      }
    })
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });
  };

  myInit();

// ======== Main functions =========

$scope.deleteNode = function(adid){
  if(confirm('Are you sure? It may take some time (Approx 1min every 100 items)')){
    $scope.loadedPage = false;
    nodeAPIService.updateOne(adid, {status : "deleted"}) // upd status to removed of node in MONGO
    .then(
      function successCallback(response){
        if(response.error){
          $scope.loadedPage = true;
          Notification.error("Error deleting node");
          myInit();
        } else {
          $scope.loadedPage = true;
          Notification.success("Access Point successfully removed!!");
          myInit();
        }
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Error deleting node");
      });
    }
  };

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

    $scope.onSort = function(order){
      $scope.rev = order;
    };

});
