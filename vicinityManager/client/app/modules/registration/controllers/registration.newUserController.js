'use strict'

angular.module('Registration')

  .controller('registrationNewUserController',
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
               $scope.registration = {};


// ===== Update status to verified =======
             var myInit = function(){
               registrationsAPIService.getOne($stateParams.registrationId).then(
                 function successCallback(response){
                   $scope.registration = response.data.message;
                  if ($scope.registration.status == "open" || $scope.registration.status == "pending"){
                     registrationsAPIService.putOne($stateParams.registrationId, {status: "verified"}).then(
                       function successCallback(){
                      //  $window.alert("verified");
                       // TODO update the process and do it in the server side
                      //  postNewUsers($scope.registration);
                      //  registrationsAPI.postOneUserAccount(data).then(
                      //    function successCallback(response){
                      //    },
                      //    function errorCallback(response){}
                      //  );

                     },
                     function errorCallback(){$window.alert("verification failed");}
                   );
                    }
                    else{$window.alert("already verified")}
                 },
                 function errorCallback(){$window.alert("verification failed");}
               );
             }


              myInit();


              // var postNewUsers = function(data){
              //   registrationsAPI.postOneUserAccount(data).then(
              //     function successCallback(response){
              //
              //
              //     },
              //     function errorCallback(response){}
              //   );
              // }

}]);
