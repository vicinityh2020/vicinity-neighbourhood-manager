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
  $scope.loaded = false;

  itemsAPIService.getItemWithAdd($stateParams.deviceId)
    .then(
      function successCallback(response){
        $scope.device = response.data.message;

        if ($scope.device.accessLevel == 4){
          userAccountAPIService.getUserAccounts()
            .then(
              function successCallback(response){                                     //pole useraccountov
                $scope.friends=response.data.message;
                // $scope.AL = 4;
              },
              function errorCallback(response){
              }
            )
        }else if ($scope.device.accessLevel == 1) {
          $scope.note = "Device is private. No one can see this device.";
          $scope.giveNote = true;
        }else {
          userAccountAPIService.getFriends($scope.device.hasAdministrator[0]._id).then( function successCallback(response){
            $scope.friends = response.data.message;
            // $scope.AL = $scope.device.accessLevel;
          },
          function errorCallback(response){
          }
        )
        };
        $scope.loaded = true;
      },
      function errorCallback(response){
      }
    );



  // userAccountAPIService.getFriends($stateParams.companyAccountId).success(function (data) {
  //   $scope.friends = data.message;
  // });







});
