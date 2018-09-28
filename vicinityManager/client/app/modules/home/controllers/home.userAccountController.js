'use strict';
angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, $cookies, commonHelpers, userAccountAPIService, AuthenticationService, Notification) {
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  $scope.companyAccountId = {};
  $scope.loaded = false;

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.signout = function(){
    console.log("Begin: Signout");
    $cookies.remove("rM_V"); // If log out remove rememberMe cookie
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  };

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId)
  .then(function(response){
      var i=0;
      var j=0;
      while (i === 0){
        if (response.data.message.accountOf[j].id.email === $window.sessionStorage.username){
          $scope.name =response.data.message.accountOf[j].id.name;
          $scope.occupation=response.data.message.accountOf[j].id.occupation;
          $scope.avatar =response.data.message.accountOf[j].id.avatar;
          $scope.userAccountId = $window.sessionStorage.userAccountId;
          i=1;
        }
        j++;
      }
      $scope.organisation = response.data.message.name;
      $scope.companyAccountId = response.data.message._id;
      $scope.loaded = true;
  })
  .catch(function(err){
    console.log(err);
    Notification.error("Server error");
  });

});
