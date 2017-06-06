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

//=================================
  $scope.rev = false;
  $scope.myOrderBy = 'name';

  nodeAPIService.getAll($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.nodes = response.data.message.hasNodes;
      },
      function errorCallback(response){}
    );

  $scope.goToEdit = function(i){
      $state.go("root.main.nodeDetail",{nodeId: i});
  }

  $scope.orderByMe = function(x) {
    if($scope.myOrderBy === x){$scope.rev=!($scope.rev)}
      $scope.myOrderBy = x;
    }

    $scope.deleteNode = function(id){
      var newNodes = [];
      for(var i = 0; i < $scope.nodes.length; i++){
        if($scope.nodes[i]._id !== id){
          newNodes.push($scope.nodes[i]._id);
        }
      }
      var query = {hasNodes: newNodes};
      nodeAPIService.deleteOne($window.sessionStorage.companyAccountId,query)
        .then(
          function successCallback(response){
            var query2 = {
              status : "deleted"
            };
            nodeAPIService.updateOne(id, query2)
              .then(
                function successCallback(response){
                  $window.alert("Successfully removed!!");
                },
                function errorCallback(response){}
              );
          },
          function errorCallback(response){}
        );
    }

});
