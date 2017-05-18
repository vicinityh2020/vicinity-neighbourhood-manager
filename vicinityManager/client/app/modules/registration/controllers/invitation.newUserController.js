'use strict'

angular.module('Registration')

  .controller('invitationNewUserController',
             ['$scope', '$rootScope', '$location', '$state', '$window', '$stateParams', 'invitationsAPIService', 'registrationsAPIService', 'userAccountAPIService', 'AuthenticationService',
             function ($scope, $rootScope, $location, $state, $window, $stateParams, invitationsAPIService, registrationsAPIService, userAccountAPIService, AuthenticationService){

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

               $('div#newOrganisationInfo').hide();
               $('div#newUserInfo').show();
               $('div#verEmailSent').hide();

// Onload get invitation info

            var myInit = function(){
               invitationsAPIService.getOne($stateParams.invitationId)
                .then(
                 function successCallback(response){
                 var results = response.data.message;
                 $scope.companynameUs = results.sentBy.organisation;
                 $scope.companyIdUs = results.sentBy.companyId;
               },
                function errorCallback(response){}
              );
            }
            myInit();

// Register new user

               $scope.regisUser = function () {
                var $pass1 = $("#pwUs1");
                var $pass2 = $("#pwUs2");
                if ($scope.password1Us){
                  if ($scope.password1Us === $scope.password2Us){
                    registrationsAPIService.postOne({userName: $scope.nameUs, email: $scope.emailUs, password: $scope.password1Us, occupation: $scope.occupationUs, companyName: $scope.companynameUs , companyId:$scope.companyIdUs ,companyLocation: "", type: "newUser"})
                      .then(
                        function successCallback(response){
                          $('div#newUserInfo').fadeOut('slow');
                          setTimeout(function() {
                           $('div#verEmailSent').fadeIn();
                           }, 1000);
                        },
                        function errorCallback(){$window.alert("There was an issue in the registration process...");}
                      );
                    }else{
                      $window.alert("Passwords do not match...");
                      $pass1.addClass("invalid");
                      $pass2.addClass("invalid");
                      setTimeout(function() {
                        $pass1.removeClass("invalid");
                        $pass2.removeClass("invalid");
                      }, 2000);
                    };
                  };
                }

}]);
