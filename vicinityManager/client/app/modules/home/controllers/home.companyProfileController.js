angular.module('VicinityManagerApp.controllers')
.controller('companyProfileController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.locationPrefix = $location.path();
  console.log("location:" + $location.path());
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
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




    $scope.sendNeighbourRequest = function () {
        var result = userAccountAPIService
            .sendNeighbourRequest($stateParams.companyAccountId)
                .success(function(response) {
                    if (response.error == true) {
                        Notification.error("Sending neighbour request failed!");
                    } else {
                        Notification.success("Neighbour request sent!");
                    }

                    userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
                });
    }

    $scope.acceptNeighbourRequest = function () {
        userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
            .success(function(response){
                if (response.error == true) {
                    Notification.error("Neighbour request acceptation failed :(");
                } else {
                    Notification.success("Neighbour request accepted!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
                // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);  

            });
    }

    $scope.rejectNeighbourRequest = function() {
        userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbour request rejection failed :(");
                } else {
                    Notification.success("Neighbour request rejected!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
            });
    }

    $scope.cancelNeighbourRequest = function() {
        userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbour request cancelation failed :(");
                } else {
                    Notification.success("Neighbour request canceled!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
            });
    }

    $scope.cancelNeighbourship = function() {
        userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbourship cancelation failed :(");
                } else {
                    Notification.success("Neighbourship canceled!");
                }

                userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
            });
    }

  if ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId){
    $scope.isMyProfile = true;
  } else {
    $scope.isMyProfile = false;
  }

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);

  function updateScopeAttributes(response){
      $scope.name = response.message.organisation;
      $scope.avatar = response.message.avatar;
      $scope.occupation = response.message.accountOf.occupation;
      $scope.organisation = response.message.organisation;
      $scope.userAccountId = response.message._id;
      $scope.location = response.message.accountOf.location;
      $scope.badges = response.message.badges;
      $scope.notes = response.message.notes;
      $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
      $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
      $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
      $scope.isNeighbour = response.message.isNeighbour;
      $scope.friends = response.message.knows;
  };
});
