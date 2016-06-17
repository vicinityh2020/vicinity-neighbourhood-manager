'use strict'

angular.module('Authentication')

  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$state', '$window', 'AuthenticationService',
             function ($scope, $rootScope, $location, $state, $window, AuthenticationService){
               //rest login status
               AuthenticationService.ClearCredentials();

               $scope.isError = false;
               $scope.visib = 'visible';
               $scope.visib2 = 'hidden';
               $scope.showPass = "password";

               $("#myCheck").prop("checked", false);
               $("#pass").prop("type", "password");


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
             }]);
