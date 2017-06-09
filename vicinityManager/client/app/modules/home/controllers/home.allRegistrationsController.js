angular.module('VicinityManagerApp.controllers').
  controller('allRegistrationsController',
  function ($scope,
            registrationsAPIService,
            registrationsListService,
            Notification) {

// Initialize variables
    $scope.regisList = [];
    $scope.rev = false;
    $scope.myOrderBy = 'companyName';

    $scope.myInit = function(){
    registrationsListService.getCompanies()
      .then(
        function successCallback(response){
          $scope.regisList = response.data.message;
        },
        function errorCallback(response){}
      );
    }

    $scope.myInit();

// Functions

      $scope.verifyAction = function(reg){
      registrationsAPIService.putOne(reg._id,{userName: reg.userName, email: reg.email, companyName: reg.companynameReg , type: "newCompany", status: "pending" })
        .then(
          function successCallback(response){
            Notification.success("Verification mail was sent to the company!");
            $scope.myInit();
          },
          function errorCallback(response){Notification.error("It was not possible to send the mail...");}
        );
      }

      $scope.declineAction = function(reg){
      registrationsAPIService.putOne(reg._id,{userName: reg.userName, email: reg.email, companyName: reg.companynameReg, type: "newCompany", status: "declined" })
        .then(
          function successCallback(response){
            Notification.success("Company was rejected!");
            $scope.myInit();
          },
          function errorCallback(response){Notification.error("It was not possible to send the mail...");}
        );
      }

      $scope.orderByMe = function(x) {
        if($scope.myOrderBy === x){$scope.rev=!($scope.rev)}
          $scope.myOrderBy = x;
        }

      $scope.f = function(){ // Dummy function until we define new ones
        Notification.warning("do something");
        }

  });
