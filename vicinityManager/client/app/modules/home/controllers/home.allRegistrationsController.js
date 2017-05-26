angular.module('VicinityManagerApp.controllers').
  controller('allRegistrationsController',
  function ($scope,
            $state,
            searchAPIService,
            registrationsAPIService,
            registrationsListService,
            userAccountAPIService,
            $stateParams,
            $window,
            $location,
            $http,
            Notification) {

// Define variables
    $scope.regisList = [];

// Functions
    registrationsListService.getCompanies()
      .then(
        function successCallback(response){
          $scope.regisList = response.data.message;
        },
        function errorCallback(response){}
      );

      $scope.orderByMe = function(x) {
          $scope.myOrderBy = x;
        }

      $scope.f = function(){ // Dummy function until we define new ones
        $window.alert("do something");
        }

      // $scope.goToProfile = function(){
      //   $state.go("root.main.registrationProfile.regAdmin({registrationId: regis._id})");
      // }

      $scope.verifyAction = function(i){
      registrationsAPIService.putOne($scope.regisList[i]._id,{userName: $scope.regisList[i].userName, email: $scope.regisList[i].email, companyName: $scope.regisList[i].companynameReg , type: "newCompany", status: "pending" })
        .then(
          function successCallback(response){
            $window.alert("Verification mail was sent to the company!");
            registrationsListService.getCompanies()
              .then(
                function successCallback(response){
                  $scope.regisList = response.data.message;
                },
                function errorCallback(response){}
              );
          },
          function errorCallback(response){$window.alert("It was not possible to send the mail...");}
        );
      }

      $scope.declineAction = function(i){
      registrationsAPIService.putOne($scope.regisList[i]._id,{userName: $scope.regisList[i].userName, email: $scope.regisList[i].email, companyName: $scope.regisList[i].companynameReg , type: "newCompany", status: "declined" })
        .then(
          function successCallback(response){
            $window.alert("Company was rejected!");
            registrationsListService.getCompanies()
              .then(
                function successCallback(response){
                  $scope.regisList = response.data.message;
                },
                function errorCallback(response){}
              );
          },
          function errorCallback(response){$window.alert("It was not possible to send the mail...");}
        );
      }

  });
