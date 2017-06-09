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

// ======== Set initial variables ==========

            $scope.nName = "";
            $scope.nUri = "";
            $scope.nAgent = "";
            $scope.nPass = "";
            $scope.nPass2 = "";
            $scope.nType = "";
            $scope.nId = "";

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
                  $scope.nType = response.data.message.type[0];
                  $scope.myNode = $scope.nName + " profile view";
                },
                function errorCallback(response){}
              );
            }

// ======== Main functions =========

            $scope.submitNode = function(){
              if($scope.nPass === $scope.nPass2){
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

                          $scope.nId = response.data.message._id;

                          var payload = {
                            username : $scope.nId,
                            name: $scope.nName,
                            password: $scope.nPass,
                            properties: { property:
                                        [
                                          {'@key':'agent', '@value': $scope.nAgent},
                                          {'@key':'uri', '@value': $scope.nUri}
                                              ]}
                          };

                          nodeAPIService.postResource('users',payload)
                            .then(
                              function successCallback(response){
                                nodeAPIService.postResource('users' , { route : $scope.nId + '/groups/' + $window.sessionStorage.companyAccountId})
                                  .then(
                                    function successCallback(response){
                                      Notification.success("Node successfully created!!");
                                      $scope.backToList();
                                    },
                                    function errorCallback(response){
                                        $window.alert("Error");
                                    });
                              },
                              function errorCallback(response){
                                  $window.alert("Error");
                              });
                      },
                      function errorCallback(response){}
                    );
                }else{

                nodeAPIService.updateOne($state.params.nodeId, query)
                  .then(
                    function successCallback(response){

                      var payload = {
                        name: $scope.nName,
                        password: $scope.nPass,
                        properties: { property:
                                    [
                                      {'@key':'agent', '@value': $scope.nAgent},
                                      {'@key':'uri', '@value': $scope.nUri}
                                          ]},
                        route: $state.params.nodeId
                      };
                      a = JSON.stringify(payload);
                      nodeAPIService.putResource('users',payload)
                        .then(
                          function successCallback(response){
                            Notification.success("Node successfully modified!!");
                            $scope.backToList();
                          },
                          function errorCallback(response){
                              $window.alert("Error");
                          });
                    },
                    function errorCallback(response){}
                  );
                }
              }else{
                $window.alert("The passwords do not match!!");
                $scope.nPass = $scope.nPass2 = ""
              }
            }



// ==== Navigation functions =====

            $scope.backToList = function(){
                $state.go("root.main.myNodes");
            }

            $scope.toModify= function(){
              $scope.modify = true;
              $scope.myNode = "Modifying node: " + $scope.nName;
            }

  });
