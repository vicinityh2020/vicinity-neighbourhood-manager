'use strict'

angular.module('Registration')

  .controller('invitationNewUserController',
             ['$scope', '$rootScope', '$location', '$state', '$window', '$stateParams', 'invitationsAPIService', 'registrationsAPIService', 'userAccountAPIService', 'AuthenticationService',
             function ($scope, $rootScope, $location, $state, $window, $stateParams, invitationsAPIService, registrationsAPIService, userAccountAPIService, AuthenticationService){
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
               $scope.companyName = "";
               $scope.companyId = "";

               invitationsAPIService.getOne($stateParams.invitationId).success(function(response){
                 var results = response.message;
                 $scope.companyName = results.sentBy.organisation;
                 $scope.companyId = results.sentBy.companyId;
               });

               $("#myCheck").prop("checked", false);
               $("#pass").prop("type", "password");
               $('div#newOrganisationInfo').hide();
               $('div#newUserInfo').show();
               $('div#alert2').hide();
               $('div#verEmailSent').hide();

              //  userAccountAPIService.getUserAccounts().success(function (response){
              //    var results = response.message;
              //    $scope.comps = results;
              //   //  $scope.loaded = true;
              //  });


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

               $scope.login = function() {

                 $scope.dataLoading = true;

                 AuthenticationService.Login($scope.username, $scope.password, function(response){

                   var $user = $("#user");
	                 var $pass = $("#pass");
	                 var $button = $("#login-button");
                  //  var $warButton = $("#warButt");

                   if(response.success){
                    //  Notification.success("Welcome to Vicinity!");
                     AuthenticationService.SetCredentials($scope.username, $scope.password, response.message);
                     $location.path("/home");
                     $scope.isError = false;
                     $('div#alert2').hide();
                   } else {
                     $scope.error = "Incorrect email or password";

                     $user.addClass("invalid");
			               $pass.addClass("invalid");

                    //  Notification.error("Incorrect email or password");
                    //  $scope.isError = true;
                    //  $('div#alert2').show();
                    //  $scope.dataLoading = false;

                     setTimeout(function() {
                      $user.removeClass("invalid");
			                $pass.removeClass("invalid");
                      // $scope.dataLoading = false;
                    }, 2000);

                    //  setTimeout(function() {
                    //   $('#zmiz').hide('fast');
                    //   $('#kuk').show();
                    //   $scope.isError = false;
                    // }, 3000);

                      // $('#kuk').show();
                    // $state.reload();
                   }

                 });

               };

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
                     $('#newRegistr').fadeIn('slow');
                     $('div#newRegistr').fadeIn('slow');
                     $('select#newRegistr').fadeIn('slow');
                     $('a#zmiz').fadeIn('slow');
                     $('div#zmiz2').fadeIn('slow');
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

              //  $scope.showThisAndThat = function(select){
              //    if (select.value === '1'){
              //      $('div#newOrganisationInfo').fadeIn('slow');
              //      $scope.newComp = true;
              //      $scope.newUser = false;
              //    }else if (select.value === '2') {
              //      $('div#newOrganisationInfo').fadeOut('slow');
              //      $scope.newComp = false;
              //      $scope.newUser = true;
              //    };
              //  }

               $('select#newRegistr').on('change', function() {
                 if (this.value === '1'){
                   $('div#newUserInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('div#zmiz2').fadeOut('slow');
                   $('div#alert2').fadeOut('slow');
                   setTimeout(function() {
                    $('div#newOrganisationInfo').fadeIn('slow');
                    $('a#zmiz').fadeIn('slow');
                  }, 1000);
                   $scope.newComp = true;
                  //  $scope.newUser = false;
                 }else if (this.value === '2') {
                   $('div#newOrganisationInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('div#zmiz2').fadeOut('slow');
                   $('div#alert2').fadeOut('slow');
                   setTimeout(function() {
                    $('div#newUserInfo').fadeIn('slow');
                    $('a#zmiz').fadeIn('slow');
                  }, 1000);
                  //  $scope.newComp = false;
                   $scope.newUser = true;
                 }else{
                   $('div#newOrganisationInfo').fadeOut('slow');
                   $('div#newUserInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('div#zmiz2').fadeOut('slow');
                   $('div#alert2').fadeOut('slow');
                   setTimeout(function() {
                    $('a#zmiz').fadeIn('slow');
                    $('div#zmiz2').css('padding-left', '0px');
                    $('div#zmiz2').fadeIn('slow');
                  }, 1000);
                 };
               });

               $scope.registerUser = function () {
                 var $pass1 = $("#pass1");
                 var $pass2 = $("#pass2");
                 if ($scope.firstPass === $scope.secondPass){
                    $('div#newUserInfo').fadeOut('slow');
                    setTimeout(function() {
                     $('div#verEmailSent').fadeIn('slow');
                   }, 1000);
                   registrationsAPIService.postOne({userName: $scope.nameUser, email: $scope.emailUser, password: $scope.firstPass, occupation: $scope.occupation, companyId: $scope.companyId, companyName: $scope.companyName , companyLocation: "", type: "newUser"}).success(function (){
                    //  emailTo: $scope.emailCompany, nameTo: $scope.nameCompany, sentBy: {name: $scope.user.name, organisation: $scope.comp.organisation, email: $scope.user.email}
                    // type: "newCompany"
                    //  $('div#myModal2').hide();
                   });
                 }else{
                   $pass1.addClass("invalid");
                   $pass2.addClass("invalid");
                   setTimeout(function() {
                    $pass1.removeClass("invalid");
                    $pass2.removeClass("invalid");
                   }, 2000);
                 };
               }

             }]);
