'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('settingsController',
function ($scope, $window, commonHelpers, tokenDecoder, userAccountAPIService, invitationsAPIService, userAPIService, Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

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

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId)
  .then(function(response) {
      $scope.comp = response.data.message;
      var index = 0;
      for (index in $scope.comp.accountOf){
        if ($scope.comp.accountOf[index].id._id.toString() === $window.sessionStorage.userAccountId.toString()){
          var payload = tokenDecoder.deToken();
          if(payload.roles.indexOf('administrator') !== -1){
            $scope.isAdmin = true;
          }
        }
      }
    })
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });

  userAPIService.getUser($window.sessionStorage.userAccountId)
    .then(function(response) { $scope.user = response.data.message; })
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });

  $scope.alertPopUp1 = function () {
    $('div#myModal1').show();
  };

  $scope.alertPopUp2 = function () {
    $('div#myModal2').show();
  };

  $scope.closeNow1 = function () {
    $('div#myModal1').hide();
  };

  $scope.closeNow2 = function () {
    $('div#myModal2').hide();
  };

  $scope.inviteCompany = function (validBool2) {
    if (validBool2){
      var data = {
          emailTo: $scope.emailCompany,
          nameTo: $scope.nameCompany,
          organisation: $scope.comp.name,
          type: "newCompany"};
      invitationsAPIService.postOne(data)
      .then(
        function(response){
        $('div#myModal2').hide();
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Error inviting company");
      });
    }else{
      $('input#emailVer2').addClass("invalid");
      setTimeout(function() {
        $('input#emailVer2').removeClass("invalid");
      }, 2000);
    }
  };

  $scope.inviteUser = function (validBool) {
    if (validBool) {
      var data = {
          emailTo: $scope.emailUser,
          nameTo: $scope.nameUser,
          organisation: $scope.comp.name,
          type: "newUser"};

      invitationsAPIService.postOne(data)
      .then(
        function(response){
        $('div#myModal1').hide();
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Error inviting user");
      });
    }else{
      $('input#emailVer').addClass("invalid");
      setTimeout(function() {
        $('input#emailVer').removeClass("invalid");
      }, 2000);
    }
  };

});
