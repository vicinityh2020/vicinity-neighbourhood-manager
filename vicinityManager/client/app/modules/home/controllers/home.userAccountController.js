angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, userAccountAPIService, AuthenticationService) {
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  
  $scope.signout = function(){
    console.log("Begin: Signout");
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  }
  
  userAccountAPIService.getUserAccountProfile($window.sessionStorage.userAccountId).success(function (response) {
    $scope.name = response.message.accountOf.name;
    $scope.avatar = response.message.avatar;
    $scope.occupation = response.message.accountOf.occupation;
    $scope.organisation = response.message.accountOf.organisation;
    $scope.userAccountId = response.message._id;
  });
});