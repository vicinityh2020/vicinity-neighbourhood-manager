angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, $cookies, userAccountAPIService, AuthenticationService) {
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  $scope.companyAccountId = {};
  $scope.loaded = false;
  
  // ====== Triggers window resize to avoid bug =======
      $(window).trigger('resize');
        $interval(waitTillLoad, 100, 1);
        function waitTillLoad(){
          $(window).trigger('resize');
        }

  $scope.signout = function(){
    console.log("Begin: Signout");
    $cookies.remove("rM_V"); // If log out remove rememberMe cookie
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  }

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).then(
    function successCallback(response){

    i=0;
    j=0;
    while (i==0){
      if (response.data.message.accountOf[j].email==$window.sessionStorage.username){
        $scope.name =response.data.message.accountOf[j].name;
        $scope.occupation=response.data.message.accountOf[j].occupation;
        $scope.avatar =response.data.message.accountOf[j].avatar;
        $scope.userAccountId = $window.sessionStorage.userAccountId;
        i=1;
      };
      j++;
    }

    $scope.organisation = response.data.message.organisation;
    $scope.companyAccountId = response.data.message._id;
    $scope.loaded = true;
  },
  function errorCallback(response){
  }
);


});
