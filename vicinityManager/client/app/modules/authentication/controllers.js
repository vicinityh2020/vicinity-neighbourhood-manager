'use strict';

angular.module('Authentication')

  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$state', '$window', 'userAccountAPIService', 'AuthenticationService', 'registrationsAPIService', 'Notification',
             function ($scope, $rootScope, $location, $state, $window, userAccountAPIService, AuthenticationService, registrationsAPIService, Notification){


// INITIAL set up ===============================================
               //reset login status
               AuthenticationService.ClearCredentials();
               $scope.duplicities = [];
               $scope.isError = false;
              //  $scope.visib = 'visible';
              //  $scope.visib2 = 'hidden';
               $scope.showPass = "password";
              //  $scope.newRegisHide = true;
              //  $scope.newRegis = false;
              //  $scope.newComp = false;
              //  $scope.newUser = false;
               $scope.number = 1;
               $scope.note ="Register new company";
               $scope.note2 = "Log in to start your session";
               $scope.error = "";
               $scope.termsAccepted = false;
               $scope.rememberMe = false;

               $('div#allTemplates').show();
               $('div#login-wrap').show();
               $('div#myModal1').hide();
               $("#myCheck").prop("checked", false);
               $("#pass").prop("type", "password");
               $('div#newOrganisationInfo').hide();
               $('div#newUserInfo').hide();
               $('div#verEmailSent').hide();
               $('div#forgot1').hide();
               $('div#forgot2').hide();

// Check screen resolution

$scope.imMobile = Number($window.innerWidth) < 768;
$(window).on('resize',function(){
  $scope.imMobile = Number($window.innerWidth) < 768;
});

// Look for rememberMe cookie ==================================

             AuthenticationService.wasCookie();

// LOGIN function ===============================================
             $scope.login = function() {

               $scope.dataLoading = true;
               AuthenticationService.Login($scope.username, $scope.password)
                .then(
                  function successCallback(response){
                    var $user = $("#user");
                    var $pass = $("#pass");

                     if(response.data.success){
                      //  Notification.success("Welcome to Vicinity!");
                       AuthenticationService.SetCredentials(response.data.message);
                       if($scope.rememberMe){AuthenticationService.SetRememberMeCookie(response.data.message);}
                       $location.path("/home");
                       $scope.isError = false;
                     } else {
                       $scope.error = "Incorrect email or password";
                       $user.addClass("invalid");
                       $pass.addClass("invalid");

                      //  Notification.error("Incorrect email or password");
                       $scope.isError = true;
                       $scope.dataLoading = false;
                       $scope.password = "";

                       setTimeout(function() {
                         $user.removeClass("invalid");
                         $pass.removeClass("invalid");
                         $scope.dataLoading = false;
                      }, 2000);
                     }
                  },
                  function errorCallback(response){}
                  );
                };



// Function for registering new company

              $scope.registerCompany = function () {
                var $pass1 = $("#pw1");
                var $pass2 = $("#pw2");
                if ($scope.password1Reg === $scope.password2Reg){
                  if($scope.duplicities.length === 0){
                    registrationsAPIService.postOne({userName: $scope.nameReg, email: $scope.emailReg,
                                                    password: $scope.password1Reg, occupation: $scope.occupationReg,
                                                    companyName: $scope.companynameReg , companyLocation: $scope.locationReg,
                                                    businessId: $scope.bidReg, termsAndConditions: true, type: "newCompany"})
                      .then(
                        function successCallback(response){
                        $('div#allTemplates').fadeOut('slow');
                        setTimeout(function() {
                         $('div#verEmailSent').fadeIn();
                         }, 1000);
                       },
                       function errorCallback(){Notification.warning("There was an issue in the registration process...");}
                     );
                  }else{
                    loopArray($scope.duplicities);
                    Notification.warning('There are duplicated values!!!');
                    $scope.duplicities = [];
                  }
                }else{
                  Notification.warning("Passwords do not match...");
                  $pass1.addClass("invalid");
                  $pass2.addClass("invalid");
                   setTimeout(function() {
                    $pass1.removeClass("invalid");
                    $pass2.removeClass("invalid");
                   }, 2000);
                }
              };

                $scope.findMeDuplicates = function(){
                  registrationsAPIService.findDuplicatesUser({email: $scope.emailReg})
                  .then(
                    function successCallback(response){
                      if(response.data.message){
                        $scope.duplicities.push(response.data.message);
                      }
                      registrationsAPIService.findDuplicatesCompany({companyName: $scope.companynameReg, businessID: $scope.bidReg})
                        .then(
                          function successCallback(response){
                            if(response.data.message){
                              $scope.duplicities.push(response.data.message);
                            }
                            $scope.registerCompany();
                          },
                          function errorCallback(reponse){}
                        );
                      },
                      function errorCallback(reponse){}
                    );
                  };

                  $scope.recoverPwd = function(){
                    AuthenticationService.recover({username : $scope.emailRecover})
                      .then(
                        function successCallback(response){
                        if(response.data.error){
                          Notification.warning("The username does not exist...");
                          $scope.emailRecover = "";
                        }else{
                          $('div#allTemplates').fadeOut('slow');
                          setTimeout(function() {
                           $('div#forgot2').fadeIn();
                           }, 1000);
                         }
                        },
                        function errorCallback(response){}
                      );
                    };

                  var loopArray = function(arr) {
                    if ( typeof(arr) == "object") {
                        for (var i = 0; i < arr.length; i++) {
                          // console.log(arr[i]);
                          if($scope.companynameReg === arr[i].organisation){
                            $scope.companynameReg = "";
                          }
                          if($scope.emailReg === arr[i].email){
                            $scope.emailReg = "";
                          }
                          if($scope.bidReg === arr[i].businessID){
                            $scope.bidReg = "";
                          }
                          loopArray(arr[i]);
                        }
                    }
                };

// Handling modals

              $scope.alertPopUp1 = function () {
                $('div#myModal1').show();
              };

              $scope.closeNow1 = function () {
                $('div#myModal1').hide();
              };

              $scope.acceptTerms = function(){
                $scope.termsAccepted = true;
                $('div#myModal1').hide();
              };

// Switching views

          $scope.forgotPwd = function(){
            $('div#allTemplates').show();
            $('div#login-wrap').hide();
            $('div#myModal1').hide();
            $("#myCheck").prop("checked", false);
            $("#pass").prop("type", "password");
            $('div#newOrganisationInfo').hide();
            $('div#newUserInfo').hide();
            $('div#verEmailSent').hide();
            $('div#forgot2').hide();
            $scope.note = "Back to log in";
            $scope.note2 = "Recover password";
            $('div#alert2').fadeOut('slow');
            setTimeout(function() {
             $('div#forgot1').fadeIn('slow');
             }, 1000);
          };

          $scope.registerNew = function(){
            $('div#allTemplates').show();
            $('div#login-wrap').hide();
            $('div#myModal1').hide();
            $("#myCheck").prop("checked", false);
            $("#pass").prop("type", "password");
            $('div#forgot1').hide();
            $('div#newUserInfo').hide();
            $('div#verEmailSent').hide();
            $('div#forgot2').hide();
            $scope.note = "Back to log in";
            $scope.note2 = "Registration form";
            $('div#alert2').fadeOut('slow');
            setTimeout(function() {
             $('div#newOrganisationInfo').fadeIn('slow');
             }, 1000);
          };

          $scope.backToLogin = function(){
            $('div#allTemplates').show();
            $('div#newOrganisationInfo').hide();
            $('div#myModal1').hide();
            $("#myCheck").prop("checked", false);
            $("#pass").prop("type", "password");
            $('div#forgot1').hide();
            $('div#newUserInfo').hide();
            $('div#verEmailSent').hide();
            $('div#forgot2').hide();
            $scope.note = "Register new company";
            $scope.note2 = "Log in to start your session";
            $('div#alert2').fadeOut('slow');
            setTimeout(function() {
             $('div#login-wrap').fadeIn('slow');
             }, 1000);
          };

// Toggle Show/Hide password =================================

              (function ($) {
                  $.toggleShowPassword = function (options) {
                      var settings = $.extend({
                          field: "#password",
                          control: "#toggle_show_password",
                      }, options);

                      var control = $(settings.control);
                      var field = $(settings.field);

                      control.bind('click', function () {
                          if (control.is(':checked')) {
                              field.prop('type', 'text');
                              field.prop('autocomplete', 'off');
                          } else {
                              field.prop('type', 'password');
                          }
                      });
                  };
              }(jQuery));

              $.toggleShowPassword({
                field: '#pass',
                control: '#myCheck'
              });

}])

// ==== recoverPasswordController controller ========

.controller('recoverPasswordController',
           ['$scope', '$stateParams', 'AuthenticationService', 'Notification',
           function ($scope, $stateParams, AuthenticationService, Notification){

             $('div#recoverTmp').show();
             $('div#emailSentTmp').hide();
             $scope.password1 = "";
             $scope.password2 = "";

             $scope.resetMyPwd = function(){
               if($scope.password1 === $scope.password2){
                 var data = {'authentication.password' : $scope.password1};
                 AuthenticationService.resetPwd($stateParams.userId, data)
                    .then(
                      function successCallback(response){
                        $('div#recoverTmp').hide();
                        setTimeout(function() {
                          $('div#emailSentTmp').fadeIn('slow');
                        }, 1000);
                      }, function errorCallback(response){
                      }
                    );
                  }else{
                    Notification.warning("Passwords not matching");
                    $scope.password1 = "";
                    $scope.password2 = "";
                  }
                };

}]);
