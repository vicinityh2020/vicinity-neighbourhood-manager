'use strict'

angular.module('Authentication')

  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$state', '$window', 'userAccountAPIService', 'AuthenticationService', 'registrationsAPIService',
             function ($scope, $rootScope, $location, $state, $window, userAccountAPIService, AuthenticationService, registrationsAPIService){


// INITIAL set up ===============================================
               //reset login status
               AuthenticationService.ClearCredentials();

               $scope.isError = false;
               $scope.visib = 'visible';
               $scope.visib2 = 'hidden';
               $scope.showPass = "password";
               $scope.newRegisHide = true;
               $scope.newRegis = false;
               $scope.newComp = false;
               $scope.newUser = false;
               $scope.number = 1;
               $scope.note ="Register new member";
               $scope.note2 = "Log in to start your session";
               $scope.error = ""
               $scope.termsAccepted = false;
               //$scope.newRegis2 = false;
               //$scope.comps = [];

               $('div#myModal1').hide();
               $("#myCheck").prop("checked", false);
               $("#pass").prop("type", "password");
               $('div#newOrganisationInfo').hide();
               $('div#newUserInfo').hide();
               $('div#verEmailSent').hide();

              //  userAccountAPIService.getUserAccounts().success(function (response){
              //    var results = response.message;
              //    $scope.comps = results;
              //   //  $scope.loaded = true;
              //  });


// LOGIN function ===============================================
             $scope.login = function() {

               $scope.dataLoading = true;
               AuthenticationService.Login($scope.username, $scope.password, function(response){
                 // TODO change to angular
                var $user = $("#user");
                var $pass = $("#pass");
                //  var $button = $("#login-button");
                //  var $warButton = $("#warButt");

                 if(response.success){
                  //  Notification.success("Welcome to Vicinity!");
                   AuthenticationService.SetCredentials($scope.username, $scope.password, response.message);
                   $location.path("/home");
                   $scope.isError = false;
                 } else {
                   $scope.error = "Incorrect email or password";
                  // TODO change to angular
                  $user.addClass("invalid");
                  $pass.addClass("invalid");

                  //  Notification.error("Incorrect email or password");
                   $scope.isError = true;
                   $scope.dataLoading = false;
                   $scope.password = "";

                   setTimeout(function() {
                     // TODO change to angular
                    $user.removeClass("invalid");
                    $pass.removeClass("invalid");
                    $scope.dataLoading = false;
                  }, 2000);
                 }
               });
             };



// Function for registering new company

              $scope.registerCompany = function () {
                var $pass1 = $("#pw1");
                var $pass2 = $("#pw2");
                if ($scope.password1Reg === $scope.password2Reg){
                   $('div#newOrganisationInfo').fadeOut('slow');
                   setTimeout(function() {
                    $('div#verEmailSent').fadeIn('slow');
                  }, 1000);
                  registrationsAPIService.postOne({userName: $scope.nameReg, email: $scope.emailReg, password: $scope.password1Reg, occupation: $scope.occupationReg, companyName: $scope.companynameReg , companyLocation: $scope.locationReg, type: "newCompany"})
                    .then(
                      function successCallback(response){
                      $('div#allTemplates').fadeOut('slow');
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
              }

// Function for registering new user

              // $scope.registerUser = function () {
              //   var $pass1 = $("#pwUs1");
              //   var $pass2 = $("#pwUs2");
              //   if ($scope.password1Us === $scope.password2Us){
              //      $('div#newUserInfo').fadeOut('slow');
              //      setTimeout(function() {
              //       $('div#verEmailSent').fadeIn('slow');
              //     }, 1000);
              //     registrationsAPIService.postOne({userName: $scope.nameUs, email: $scope.emailUs, password: $scope.password1Us, occupation: $scope.occupationUs, companyName: $scope.companynameUs , companyLocation: "", type: "newUser"})
              //       .then(
              //         function successCallback(response){
              //           $window.alert("Registration completed, please check your mail to confirm ...");
              //           $scope.registerNew();
              //    },
              //    function errorCallback(){$window.alert("There was an issue in the registration process...");}
              //   );
              //   }else{
              //     $window.alert("Passwords do not match...");
              //     $pass1.addClass("invalid");
              //     $pass2.addClass("invalid");
              //     setTimeout(function() {
              //      $pass1.removeClass("invalid");
              //      $pass2.removeClass("invalid");
              //     }, 2000);
              //   };
              // }

// Handling modals

              $scope.alertPopUp1 = function () {
                // alert("Please copy the following link and send it to new user: http://localhost:8000/app/#/login");

                $('div#myModal1').show();
              }

              $scope.closeNow1 = function () {
                $('div#myModal1').hide();
              }

              $scope.acceptTerms = function(){
                $scope.termsAccepted = true;
                $('div#myModal1').hide();
              }
// Switching login/register view

             $scope.registerNew = function(){
               $scope.newRegisHide = false;
               if ($scope.newRegis == false){
                 $('#newRegistr').hide();
                 $('div#newRegistr').hide();
                 $('select#newRegistr').hide();
                 $scope.newRegis = true;
                 $scope.note = "Back to log in";
                 $scope.note2 = "Registration form";
                 $('div#alert2').fadeOut('slow');
                 $('div#zmiz').fadeOut('slow');
                 $('p#zmiz').fadeOut('slow');
                 $('a#zmiz').fadeOut('slow');
                 $('div#zmiz2').fadeOut('slow');
                 $('div#zmiz2').css('padding-left', '0px');
                 setTimeout(function() {
                  $('div#newOrganisationInfo').fadeIn('slow');
                  $('a#zmiz').fadeIn('slow');
                  }, 1000);
               }else{
                 $scope.newRegis = false;
                 $scope.note = "Register new member";
                 $scope.note2 = "Log in to start your session";
                 $('div#zmiz2').css('padding-left', '15px');
                 $('#newRegistr').fadeOut('slow');
                 $('div#alert2').fadeOut('slow');
                 $('div#newRegistr').fadeOut('slow');
                 $('select#newRegistr').fadeOut('slow');
                 $('div#newOrganisationInfo').fadeOut('slow');
                 $('div#newUserInfo').fadeOut('slow');
                 $('a#zmiz').fadeOut('slow');
                 $('div#zmiz2').fadeOut('slow');
                 setTimeout(function() {
                   $('div#zmiz').fadeIn('slow');
                   $('p#zmiz').fadeIn('slow');
                   $('a#zmiz').fadeIn('slow');
                   $('div#zmiz2').fadeIn('slow');
                }, 1000);
                 $('select#newRegistr option[value="0"]').prop("selected","selected");
               };
             };



            //  $('select#newRegistr').on('change', function() {
            //    if (this.value === '1'){
            //      $('div#newUserInfo').fadeOut('slow');
            //      $('a#zmiz').fadeOut('slow');
            //      $('div#zmiz2').fadeOut('slow');
            //      $('div#alert2').fadeOut('slow');
            //      setTimeout(function() {
            //       $('div#newOrganisationInfo').fadeIn('slow');
            //       $('a#zmiz').fadeIn('slow');
            //     }, 1000);
            //      $scope.newComp = true;
            //     //  $scope.newUser = false;
            //    }else if (this.value === '2') {
            //      $('div#newOrganisationInfo').fadeOut('slow');
            //      $('a#zmiz').fadeOut('slow');
            //      $('div#zmiz2').fadeOut('slow');
            //      $('div#alert2').fadeOut('slow');
            //      setTimeout(function() {
            //       $('div#newUserInfo').fadeIn('slow');
            //       $('a#zmiz').fadeIn('slow');
            //     }, 1000);
            //     //  $scope.newComp = false;
            //      $scope.newUser = true;
            //    }else{
            //      $('div#newOrganisationInfo').fadeOut('slow');
            //      $('div#newUserInfo').fadeOut('slow');
            //      $('a#zmiz').fadeOut('slow');
            //      $('div#zmiz2').fadeOut('slow');
            //      $('div#alert2').fadeOut('slow');
            //      setTimeout(function() {
            //       $('a#zmiz').fadeIn('slow');
            //       $('div#zmiz2').css('padding-left', '0px');
            //       $('div#zmiz2').fadeIn('slow');
            //     }, 1000);
            //    };
            //  });



// Toggle Show/Hide password =================================
              (function ($) {
                  $.toggleShowPassword = function (options) {
                      var settings = $.extend({
                          field: "#password",
                          control: "#toggle_show_password",
                      }, options);

                      var control = $(settings.control);
                      var field = $(settings.field)

                      control.bind('click', function () {
                          if (control.is(':checked')) {
                              field.prop('type', 'text');
                              field.prop('autocomplete', 'off');
                          } else {
                              field.prop('type', 'password');
                          }
                      })
                  };
              }(jQuery));

              $.toggleShowPassword({
                field: '#pass',
                control: '#myCheck'
              });

}]);
