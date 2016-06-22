'use strict'

angular.module('Authentication')

  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$state', '$window', 'userAccountAPIService', 'AuthenticationService',
             function ($scope, $rootScope, $location, $state, $window, userAccountAPIService, AuthenticationService){
               //rest login status
               AuthenticationService.ClearCredentials();

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
               $scope.note2 = "Log in to start your session";



               $("#myCheck").prop("checked", false);
               $("#pass").prop("type", "password");
               $('div#newOrganisationInfo').hide();
               $('div#newUserInfo').hide();

               userAccountAPIService.getUserAccounts().success(function (response){
                 var results = response.message;
                 $scope.comps = results;
                //  $scope.loaded = true;
               });


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
                   } else {
                     $scope.error = "Incorrect email or password";

                     $user.addClass("invalid");
			               $pass.addClass("invalid");

                    //  Notification.error("Incorrect email or password");
                     $scope.isError = true;
                     $scope.dataLoading = false;

                     setTimeout(function() {
                      $user.removeClass("invalid");
			                $pass.removeClass("invalid");
                      $scope.dataLoading = false;
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
                   $('div#zmiz').fadeOut('slow');
                   $('p#zmiz').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('a#zmiz2').fadeOut('slow');
                   setTimeout(function() {
                     $('#newRegistr').fadeIn('slow');
                     $('div#newRegistr').fadeIn('slow');
                     $('select#newRegistr').fadeIn('slow');
                     $('a#zmiz').fadeIn('slow');
                     $('a#zmiz2').fadeIn('slow');
                  }, 800);

                 }else{
                   $scope.newRegis = false;
                   $scope.note = "Register new member";
                   $scope.note2 = "Log in to start your session";
                   $('#newRegistr').fadeOut('slow');
                   $('div#newRegistr').fadeOut('slow');
                   $('select#newRegistr').fadeOut('slow');
                   $('div#newOrganisationInfo').fadeOut('slow');
                   $('div#newUserInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('a#zmiz2').fadeOut('slow');
                   setTimeout(function() {
                     $('div#zmiz').fadeIn('slow');
                     $('p#zmiz').fadeIn('slow');
                     $('a#zmiz').fadeIn('slow');
                     $('a#zmiz2').fadeIn('slow');
                  }, 800);
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
                   $('a#zmiz2').fadeOut('slow');
                   setTimeout(function() {
                    $('div#newOrganisationInfo').fadeIn('slow');
                    $('a#zmiz').fadeIn('slow');
                  }, 800);
                   $scope.newComp = true;
                  //  $scope.newUser = false;
                 }else if (this.value === '2') {
                   $('div#newOrganisationInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('a#zmiz2').fadeOut('slow');
                   setTimeout(function() {
                    $('div#newUserInfo').fadeIn('slow');
                    $('a#zmiz').fadeIn('slow');
                  }, 800);
                  //  $scope.newComp = false;
                   $scope.newUser = true;
                 }else{
                   $('div#newOrganisationInfo').fadeOut('slow');
                   $('div#newUserInfo').fadeOut('slow');
                   $('a#zmiz').fadeOut('slow');
                   $('a#zmiz2').fadeOut('slow');
                   setTimeout(function() {
                    $('a#zmiz').fadeIn('slow');
                  }, 800);
                 };
               });

              //  function showThisAndThat(select){
              //    if (select.value === '1'){
              //      $scope.newComp = true;
              //      $scope.newUser = false;
              //    }else if (select.value === '2') {
              //      $scope.newComp = false;
              //      $scope.newUser = true;
              //    };
              //  };

              //  $('select.menu').change(function(e){
              //    if ($("select.menu option:selected").attr('value') === '1'){
              //      $scope.newComp = true;
              //      $scope.newUser = false;
              //    }else if ($("select.menu option:selected").attr('value') === '2'){
              //      $scope.newComp = false;
              //      $scope.newUser = true;
              //    };
              //  };



             }]);
