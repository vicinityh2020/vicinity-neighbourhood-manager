angular.module('VicinityManagerApp.controllers')
.controller('settingsController',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, invitationsAPIService, userAPIService, AuthenticationService, notificationsAPIService, Notification) {

  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.oneNotif = false;
  $scope.isAdmin = false;
  $scope.numberOfUnread = 0;
  $scope.comp = {};
  $scope.user = {};
  $scope.nameCompany = "";
  $scope.emailCompany = "";
  $scope.nameUser = "";
  $scope.emailUser = "";
  // $("#myModal").prop("display", "block");
  $('div#myModal1').hide();
  $('div#myModal2').hide();

  $(document).keyup(function(e) {
     if (e.keyCode == 27) {
        $('div#myModal1').hide();
        $('div#myModal2').hide();
    }
});

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

  userAPIService.getUser($window.sessionStorage.userAccountId).success(function (response) {
    $scope.user = response.message;
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

  $scope.inviteCompany = function () {
    // invitationsAPIService.postOne({emailTo: $scope.emailCompany, nameTo: $scope.nameCompany, sentBy: {name: $scope.user.name, organisation: $scope.comp.organisation, email: $scope.user.email}, type: "newCompany"}, function (response){
    //
    //   var $emailVer = $('input#emailVer');
    //
    //   $('div#myModal2').hide();
    //
    //   if(response.success){
    //     $('div#myModal2').hide();
    //
    //   }else{
    //     // $emailVer.addClass("invalid");
    //     $emailVer.addClass("invalid");
    //
    //     setTimeout(function() {
    //      $('input#emailVer').removeClass("invalid");
    //
    //    }, 2000);
    //   };
    // });

    invitationsAPIService.postOne({emailTo: $scope.emailCompany, nameTo: $scope.nameCompany, sentBy: {name: $scope.user.name, companyId: $window.sessionStorage.companyAccountId, organisation: $scope.comp.organisation, email: $scope.user.email}, type: "newCompany"}).success(function (){
      $('div#myModal2').hide();
    });


  }

  $scope.inviteUser = function () {
    data = {
        emailTo: $scope.emailUser,
        nameTo: $scope.nameUser,
        sentBy:
          {name: $scope.user.name,
            companyId: $window.sessionStorage.companyAccountId,
            organisation: $scope.comp.organisation,
            email: $scope.user.email},
        type: "newUser"};

    invitationsAPIService.postOne(data).success(function (){
      $('div#myModal1').hide();
    });
  }



});
