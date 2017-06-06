angular.module('VicinityManagerApp.controllers').
  controller('nodeDetailController',
  function ($scope,
            $state,
            $stateParams,
            $window,
            $location,
            $http,
            nodeAPIService,
            Notification) {

            $scope.nName = "";
            $scope.nUri = "";
            $scope.nAgent = "";
            $scope.nPass = "";
            $scope.nType = "";

            $scope.modify = true;
            $scope.nodeId = $state.params.nodeId;
            $scope.myNode = "Creating new node";

            if($scope.nodeId !== '0'){
            $scope.modify = false;
            nodeAPIService.getOne($state.params.nodeId)
              .then(
                function successCallback(response){
                  $scope.nName = response.data.message.name;
                  $scope.nUri = response.data.message.eventUri;
                  $scope.nAgent = response.data.message.agent;
                  $scope.nPass = "*********";
                  $scope.nType = response.data.message.type[0];
                  $scope.myNode = $scope.nName + " profile view";
                },
                function errorCallback(response){}
              );
            }

            $scope.submitNode = function(){
              var query = {
                name: $scope.nName,
                eventUri: $scope.nUri,
                agent: $scope.nAgent,
                type: "generic.adapter.vicinity.eu"
              };
              if($scope.nodeId === '0'){

                nodeAPIService.postOne($window.sessionStorage.companyAccountId, query)
                  .then(
                    function successCallback(response){
                      $scope.backToList();
                    },
                    function errorCallback(response){}
                  );
              }else{

              nodeAPIService.updateOne($state.params.nodeId, query)
                .then(
                  function successCallback(response){
                    $scope.backToList();
                  },
                  function errorCallback(response){}
                );
              }
            }

            $scope.backToList = function(){
                $state.go("root.main.myNodes");
            }

            $scope.toModify= function(){
              $scope.modify = true;
              $scope.myNode = "Modifying node: " + $scope.nName;
            }

  });
