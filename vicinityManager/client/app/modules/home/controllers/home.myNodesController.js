'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('myNodesController',
  function ($scope,
            $state,
            $stateParams,
            $window,
            $location,
            $http,
            commonHelpers,
            nodeAPIService,
            Notification) {

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
    .then(
      function successCallback(response){
        $scope.nodes = response.data.message;
        countItems();
        $scope.loadedPage = true;
      },
      function errorCallback(response){}
    );
  };

  myInit();

// ======== Main functions =========

  $scope.deleteNode = function(adid){
    if(confirm('Are you sure?')){
      nodeAPIService.updateOne(adid, {status : "deleted"}) // upd status to removed of node in MONGO
        .then(
          function successCallback(response){
            Notification.success("Access Point successfully removed!!");
            myInit();
          },
          errorCallback
        );
      }
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

    $scope.onSort = function(order){
      $scope.rev = order;
    };

});
