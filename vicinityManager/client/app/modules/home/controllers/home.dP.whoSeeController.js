angular.module('VicinityManagerApp.controllers')
.controller('dPwhoSeeController',
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
  $scope.note = "";
  $scope.AL = 0;
  $scope.device = {};
  $scope.giveNote = false;

  itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function(data){
    $scope.device = data.message;

    if ($scope.device.accessLevel == 4){
      userAccountAPIService.getUserAccounts().success(function(data){                                     //pole useraccountov
      $scope.friends=data.message;
      // $scope.AL = 4;
    })
    }else if ($scope.device.accessLevel == 1) {
      $scope.note = "Device is private. No one can see this device.";
      $scope.giveNote = true;
    }else {
      userAccountAPIService.getFriends($scope.device.hasAdministrator[0]._id).success(function(data){
        $scope.friends = data.message;
        // $scope.AL = $scope.device.accessLevel;
      })
    };
  });



  // userAccountAPIService.getFriends($stateParams.companyAccountId).success(function (data) {
  //   $scope.friends = data.message;
  // });







});
