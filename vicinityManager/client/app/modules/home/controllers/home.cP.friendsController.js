angular.module('VicinityManagerApp.controllers')
.controller('cPfriendsController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  // $scope.locationPrefix = $location.path();
  // console.log("location:" + $location.path());
  // $scope.name = {};
  // $scope.avatar = {};
  // $scope.occupation = {};
  // $scope.organisation = {};
  // $scope.companyAccountId = {};
  // $scope.isMyProfile = true;
  // $scope.canSendNeighbourRequest = false;
  // $scope.canCancelNeighbourRequest = false;
  // $scope.canAnswerNeighbourRequest = false;
  // $scope.isNeighbour = false;
  // $scope.location = {};
  // $scope.badges = {};
  // $scope.notes = {};
  // $scope.friends = [];
  // $scope.following = [];
  // $scope.followers = [];
  // $scope.gateways = [];

  $scope.friends=[];

  userAccountAPIService.getFriends($stateParams.companyAccountId).success(function (data) {
    $scope.friends = data.message;
  });




});
