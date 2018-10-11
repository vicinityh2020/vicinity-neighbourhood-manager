'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('nodeDetailController',
  function ($scope,
            $state,
            $window,
            commonHelpers,
            nodeAPIService,
            Notification) {

// ======== Set initial variables ==========

// ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();
    $scope.nName = "";
    $scope.nUri = "";
    $scope.nAgent = "";
    $scope.nPass = "";
    $scope.nPass2 = "";
    $scope.nId = "";
    $scope.nAgentType = "";

    $scope.modify = true;
    $scope.nodeId = $state.params.nodeId;
    $scope.myNode = "Creating new Access Point";

    if($scope.nodeId !== '0'){
    $scope.modify = false;
    nodeAPIService.getOne($state.params.nodeId)
      .then(function(response){
          $scope.nName = response.data.message.name;
          $scope.nUri = response.data.message.eventUri;
          $scope.nAgent = response.data.message.agent;
          $scope.nAgentType = response.data.message.type[0];
          $scope.nId = response.data.message.adid;
          $scope.myNode = $scope.nName + " profile view";
        })
        .catch(function(err){
          console.log(err);
          Notification.error("Server error");
        });
    } else {
      $scope.nAgentType = "generic.adapter.vicinity.eu";
    }

// ======== Main functions =========

    $scope.submitNode = function(){
      if($scope.nPass === $scope.nPass2){
        var query = {
          name: $scope.nName,
          eventUri: $scope.nUri,
          agent: $scope.nAgent,
          type: $scope.nAgentType, // "generic.adapter.vicinity.eu",
          pass: $scope.nPass
        };
        if($scope.nodeId === '0'){
        nodeAPIService.postOne(query)
        .then(function(response){
          if(response.error) {
            Notification.success("Error creating Access Point");
            $scope.backToList();
          } else {
            Notification.success("Access Point successfully created!!");
            $scope.backToList();
          }
        })
        .catch(function(err){
          console.log(err);
          Notification.error("Error creating Access Point");
        });

        }else{

        nodeAPIService.updateOne($state.params.nodeId, query)
          .then(
            function successCallback(response){
              if(response.error) {
                Notification.success("Error updating Access Point");
                $scope.backToList();
              } else {
                Notification.success("Access Point successfully modified!!");
                $scope.backToList();
              }
            },
            function errorCallback(err){
              console.log(err);
              Notification.error("Error updating Access Point");
            }
          );
        }
      }else{
        $window.alert("The passwords do not match!!");
        $scope.nPass = $scope.nPass2 = "";
      }
    };



// ==== Navigation functions =====

    $scope.backToList = function(){
        $state.go("root.main.myNodes");
    };

    $scope.toModify= function(){
      $scope.modify = true;
      $scope.myNode = "Modifying Access Point: " + $scope.nName;
    };

  });
