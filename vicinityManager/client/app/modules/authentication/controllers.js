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

               $scope.login = function() {

                 $scope.dataLoading = true;

                 AuthenticationService.Login($scope.username, $scope.password, function(response){


                   if(response.success){
                    //  Notification.success("Welcome to Vicinity!");
                     AuthenticationService.SetCredentials($scope.username, $scope.password, response.message);
                     $location.path("/home");
                     $scope.isError = false;
                   } else {
                     $scope.error = "Incorrect email or password";

                    //  Notification.error("Incorrect email or password");
                     $scope.isError = true;
                     $scope.dataLoading = false;

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
