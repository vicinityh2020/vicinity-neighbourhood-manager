angular.module('VicinityManagerApp.controllers')
.controller('companyProfileController',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.locationPrefix = $location.path();
  console.log("location:" + $location.path());
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.companyAccountId = {};
  $scope.isMyProfile = true;
  $scope.canSendNeighbourRequest = false;
  $scope.canCancelNeighbourRequest = false;
  $scope.canAnswerNeighbourRequest = false;
  $scope.isNeighbour = false;
  $scope.location = {};
  $scope.badges = {};
  $scope.notes = {};
  $scope.friends = [];
  $scope.following = [];
  $scope.followers = [];
  $scope.gateways = [];
  $scope.users = [];
  $scope.devices = [];
  $scope.loaded = false;




    $scope.sendNeighbourRequest = function () {
        var result = userAccountAPIService
            .sendNeighbourRequest($stateParams.companyAccountId)
                .then(
                  function successCallback(response) {
                    if (response.data.error == true) {
                        Notification.error("Sending partnership request failed!");
                    } else {
                        Notification.success("Partnership request sent!");
                    }

                    userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                      .then(
                        function successCallback(response){
                          updateScopeAttributes(response);
                        },
                        function errorCallback(response){}
                      );
                },
                function errorCallback(response){}
              );
    }

    $scope.acceptNeighbourRequest = function () {
        userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error == true) {
                    Notification.error("Partnership request acceptation failed :(");
                } else {
                    Notification.success("Partnership request accepted!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                  .then(
                    function successCallback(response){
                      updateScopeAttributes(response);
                    },
                    function errorCallback(response){}
                  );
                // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);
            },
            function errorCallback(response){}
          );
    }

    $scope.rejectNeighbourRequest = function() {
        userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error == true) {
                    Notification.error("Partnership request rejection failed :(");
                } else {
                    Notification.success("Partnership request rejected!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                  .then(
                    function successCallback(response){
                      updateScopeAttributes(response);
                    },
                    function errorCallback(response){}
                  );
            },
            function errorCallback(response){}
          );
    }

    $scope.cancelNeighbourRequest = function() {
        userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error ==true) {
                    Notification.error("Partnership request cancelation failed :(");
                } else {
                    Notification.success("Partnership request canceled!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                  .then(
                    function successCallback(response){
                      updateScopeAttributes(response);
                    },
                    function errorCallback(response){}
                  );
            },
            function errorCallback(response){}
          );
    }

    $scope.cancelNeighbourship = function() {
        userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error ==true) {
                    Notification.error("Partnership cancelation failed :(");
                } else {
                    Notification.success("Partnership canceled!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                  .then(
                    function successCallback(response){
                      updateScopeAttributes(response);
                    },
                    function errorCallback(response){}
                  );
            },
            function errorCallback(response){}
          );
    }

    var promise = {};

    $scope.$on('$destroy', function(){
        $timeout.cancel(promise);
    });

    // $scope.$on('$locationChangeStart', function(){
    //     $timeout.cancel(promise);
    // });

      $scope.intervalFunction = function(){
        promise = $timeout(function() {
          $scope.getUserProf();
          $scope.intervalFunction();
        }, 5000)
      }

      $scope.intervalFunction();

  $scope.getUserProf = function () {

    if ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId){
      $scope.isMyProfile = true;
    } else {
      $scope.isMyProfile = false;
    }

    userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
      .then(
      function successCallback(response){
        updateScopeAttributes(response);
        $scope.loaded = true;
      },
      function errorCallback(response){}
    );

    userAccountAPIService.getMyDevices($stateParams.companyAccountId)
      .then(
        function successCallback(response){
          $scope.devices=response.data.message;
        },
        function errorCallback(response){}
      );

    }

  if ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId){
    $scope.isMyProfile = true;
  } else {
    $scope.isMyProfile = false;
  }

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        updateScopeAttributes(response);
        $scope.loaded = true;
      },
      function errorCallback(response){}
    );

  userAccountAPIService.getMyDevices($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.devices=response.message;
      },
      function errorCallback(response){}
    );

  function updateScopeAttributes(response){
      $scope.name = response.data.message.organisation;
      $scope.avatar = response.data.message.avatar;
      $scope.occupation = response.data.message.accountOf.occupation;
      $scope.organisation = response.data.message.organisation;
      $scope.companyAccountId = response.data.message._id;
      $scope.location = response.data.message.location;
      $scope.badges = response.data.message.badges;
      $scope.notes = response.data.message.notes;
      $scope.canSendNeighbourRequest = response.data.message.canSendNeighbourRequest;
      $scope.canCancelNeighbourRequest = response.data.message.canCancelNeighbourRequest;
      $scope.canAnswerNeighbourRequest = response.data.message.canAnswerNeighbourRequest;
      $scope.isNeighbour = response.data.message.isNeighbour;
      $scope.friends = response.data.message.knows;
      $scope.users = response.data.message.accountOf;
  };
});
