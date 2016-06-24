angular.module('VicinityManagerApp.controllers')
.controller('deviceProfileController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

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
  $scope.isMyDevice = false;
  $scope.serNumber = "";
  $scope.location = "";
  $scope.AL = 0;
  $scope.showInput = false;
  $scope.showImg = false;


  $scope.showLoadPic = function(){
    $scope.showInput = true;
    $('#edits1').fadeIn('slow');
    $('#edits2').fadeIn('slow');
    $('#input1').fadeIn('slow');
  };

  $scope.cancelLoadPic = function(){
    $('#edits1').fadeOut('slow');
    $('#edits2').fadeOut('slow');
    $('#input1').fadeOut('slow');
    // $scope.showInput = false;
  };

    // $scope.sendNeighbourRequest = function () {
    //     var result = userAccountAPIService
    //         .sendNeighbourRequest($stateParams.companyAccountId)
    //             .success(function(response) {
    //                 if (response.error == true) {
    //                     Notification.error("Sending neighbour request failed!");
    //                 } else {
    //                     Notification.success("Neighbour request sent!");
    //                 }
    //
    //                 userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //             });
    // }
    //
    // $scope.acceptNeighbourRequest = function () {
    //     userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error == true) {
    //                 Notification.error("Neighbour request acceptation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request accepted!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //             // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);
    //
    //         });
    // }
    //
    // $scope.rejectNeighbourRequest = function() {
    //     userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request rejection failed :(");
    //             } else {
    //                 Notification.success("Neighbour request rejected!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourRequest = function() {
    //     userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourship = function() {
    //     userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbourship cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbourship canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }

  // userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(
  //   function(response){
  //     updateScopeAttributes(response);
  //     $scope.loaded = true;
  //   });

  itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function(response){
    updateScopeAttributes(response);
    $scope.loaded = true;
  });

  // userAccountAPIService.getMyDevices($stateParams.companyAccountId).success(function(response){
  //   $scope.devices=response.message;
  // });

  function updateScopeAttributes(response){
      $scope.name = response.message.name;
      $scope.avatar = response.message.avatar;
      $scope.owner = response.message.hasAdministrator[0].organisation;
      $scope.owner_id = response.message.hasAdministrator[0]._id;
      $scope.serNumber = response.message.info.serial_number;
      $scope.location = response.message.info.location;
      $scope.AL = response.message.accessLevel;
      // $scope.occupation = response.message.accountOf.occupation;
      // $scope.organisation = response.message.organisation;
      // $scope.companyAccountId = response.message._id;
      // $scope.location = response.message.accountOf.location;
      // $scope.badges = response.message.badges;
      // $scope.notes = response.message.notes;
      // $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
      // $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
      // $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
      // $scope.isNeighbour = response.message.isNeighbour;
      // $scope.friends = response.message.knows;
      // $scope.users = response.message.accountOf;
      if ($window.sessionStorage.companyAccountId.toString() === $scope.owner_id.toString()){
        $scope.isMyDevice = true;
      } else {
        $scope.isMyDevice = false;
      }
  };
});
