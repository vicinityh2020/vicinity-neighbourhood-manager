'use strict'

angular.module('Authentication')
  
  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$window', 'AuthenticationService',
             function ($scope, $rootScope, $location, $window, AuthenticationService){
               //rest login status
               AuthenticationService.ClearCredentials();
               
               $scope.login = function() {
                 
                 $scope.dataLoading = true;
                 
                 AuthenticationService.Login($scope.username, $scope.password, function(response){
                   
                  
                   if(response.success){
                     $window.sessionStorage.token = response.message.token;
                     AuthenticationService.SetCredentials($scope.username, $scope.password);
                     $location.path("/home");
                   } else {
                     $scope.error = response.message;
                     $scope.dataLoading = false;
                   }
                   
                 });
                 
               };
             }]);

