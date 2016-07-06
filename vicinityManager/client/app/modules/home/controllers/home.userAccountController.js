angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, userAccountAPIService, AuthenticationService) {
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  $scope.companyAccountId = {};
  $scope.loaded = false;

  $scope.signout = function(){
    console.log("Begin: Signout");
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  }

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (response) {

    i=0;
    j=0;
    while (i==0){
      if (response.message.accountOf[j].email==$window.sessionStorage.username){
        $scope.name =response.message.accountOf[j].name;
        $scope.occupation=response.message.accountOf[j].occupation;
        $scope.avatar =response.message.accountOf[j].avatar;
        $scope.userAccountId = $window.sessionStorage.userAccountId;
        i=1;
      };
      j++;
    }

    $scope.organisation = response.message.organisation;
    $scope.companyAccountId = response.message._id;
    $scope.loaded = true;
  });


});
