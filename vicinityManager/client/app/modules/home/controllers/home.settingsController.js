angular.module('VicinityManagerApp.controllers')
.controller('settingsController',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, AuthenticationService, notificationsAPIService, Notification) {

  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.oneNotif = false;
  $scope.isAdmin = false;
  $scope.numberOfUnread = 0;
  $scope.comp = {};
  // $("#myModal").prop("display", "block");
  $('div#myModal1').hide();
  $('div#myModal2').hide();

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (data) {
    $scope.comp = data.message;
    var index = 0;
    for (index in $scope.comp.accountOf){
      if ($scope.comp.accountOf[index]._id.toString() === $window.sessionStorage.userAccountId.toString()){
        var index2 = 0;
        for (index2 in $scope.comp.accountOf[index].authentication.principalRoles){
          if ($scope.comp.accountOf[index].authentication.principalRoles[index2] == "administrator"){
            $scope.isAdmin = true;
          };
        };
      };
    };
  });

  $scope.alertPopUp1 = function () {
    // alert("Please copy the following link and send it to new user: http://localhost:8000/app/#/login");

    $('div#myModal1').show();
  }

  $scope.alertPopUp2 = function () {
    $('div#myModal2').show();
    // alert("Please copy the following link and send it to administrator of new company: http://localhost:8000/app/#/login");

  }

  $scope.closeNow1 = function () {
    $('div#myModal1').hide();
  }

  $scope.closeNow2 = function () {
    $('div#myModal2').hide();
  }



});
