angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, userAccountAPIService, AuthenticationService) {
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  $scope.companyAccountId = {};

  $scope.signout = function(){
    console.log("Begin: Signout");
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  }

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (response) {

    // for (i = 0; i < response.message.accountOf.length; i++) {
    //   if (response.message.accountOf[i].email==$window.sessionStorage.username){
    //     $scope.name =response.message.accountOf[i].name;
    //     $scope.occupation=response.message.accountOf[i].occupation;
    //     $scope.avatar =response.message.accountOf[i].avatar;
    //     $scope.userAccountId = response.message.accountOf[i]._id;
    //   };
    // };

    i=0;
    j=0;
    while (i==0){
      if (response.message.accountOf[j].email==$window.sessionStorage.username){
        $scope.name =response.message.accountOf[j].name;
        $scope.occupation=response.message.accountOf[j].occupation;
        $scope.avatar =response.message.accountOf[j].avatar;
        $scope.userAccountId = response.message.accountOf[j]._id;
        i=1;
      };
      j++;
    }

    // $scope.name = response.message.organisation;
    // $scope.avatar = response.message.avatar;
    // $scope.occupation = response.message.accountOf.occupation;
    $scope.organisation = response.message.organisation;
    $scope.companyAccountId = response.message._id;
  });


});
