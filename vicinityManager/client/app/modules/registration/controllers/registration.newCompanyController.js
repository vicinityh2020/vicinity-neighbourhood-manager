'use strict'

angular.module('Registration')

  .controller('registrationNewCompanyController',
             ['$scope', '$rootScope', '$location', '$state', 'configuration', '$window', '$stateParams', 'invitationsAPIService', 'registrationsAPIService', 'userAccountAPIService', 'AuthenticationService', 'Notification',
             function ($scope, $rootScope, $location, $state, configuration, $window, $stateParams, invitationsAPIService, registrationsAPIService, userAccountAPIService, AuthenticationService, Notification){
     //rest login status
    //  AuthenticationService.ClearCredentials();

     $scope.isError = false;
     $scope.visib = 'visible';
     $scope.visib2 = 'hidden';
     $scope.showPass = "password";
     $scope.newRegisHide = true;
     $scope.newRegis = false;
     $scope.newComp = false;
     $scope.newUser = false;
     $scope.newRegis2 = false;
     $scope.comps = [];
     $scope.number = 1;
     $scope.note ="Register new member";
     $scope.note2 = "Registration form";
     $scope.baseHref = configuration.baseHref + '/#/login';


     $("#myCheck").prop("checked", false);
     $("#pass").prop("type", "password");
     $('div#newOrganisationInfo').hide();
     $('div#verEmailSent').show();
     $('div#newUserInfo').hide();
     $('div#alert2').hide();


// ===== Update status to verified =======
    var myInit = function(){
      registrationsAPIService.getOne($stateParams.registrationId).then(
        function successCallback(response){
          $scope.registration = response.data.message;
          if ($scope.registration.status === "open" || $scope.registration.status === "pending"){
            registrationsAPIService.putOne($stateParams.registrationId, {status: "verified"}).then(
              function successCallback(){
              // $window.alert("verified");
            },
            function errorCallback(){
              Notification.error("Verification failed");
            }
          );
          } else {
            Notification.error("Already verified");
          }
        },
        function errorCallback(){
          Notification.error("Verification failed");
        }
      );
    };

     myInit();

}]);
