angular.module('VicinityManagerApp.controllers')
.controller('registrationProfileController',
function ($scope, $window, $stateParams, $location, registrationsAPIService, registrationsListService, Notification) {

  $scope.loaded = false;
  // $scope.locationPrefix = $location.path();


  registrationsAPIService.getOne($stateParams.registrationId)
    .then(
      function successCallback(response){
        updateScopeAttributes(response);
        $scope.loaded = true;
      },
      function errorCallback(response){
      }
    );

  function updateScopeAttributes(response){
      $scope.id = response.data.message._id;
      $scope.companyName = response.data.message.companyName;
      $scope.location = response.data.message.companyLocation;
      $scope.businessId = response.data.message.businessId;
      if(!$scope.businessId){$scope.businessId = "Not provided"};
      $scope.status = response.data.message.status;
  };

  $scope.verifyAction = function(i){
  registrationsAPIService.putOne($scope.id,{status: "pending" })
    .then(
      function successCallback(response){
        $window.alert("Verification mail was sent to the company!");
        registrationsListService.getCompanies()
          .then(
            function successCallback(response){
              $scope.status = 'pending';
            },
            function errorCallback(response){}
          );
      },
      function errorCallback(response){$window.alert("Something went wrong...");}
    );
  }

  $scope.declineAction = function(i){
  registrationsAPIService.putOne($scope.id,{status: "declined" })
    .then(
      function successCallback(response){
        $window.alert("Company was rejected!");
        registrationsListService.getCompanies()
          .then(
            function successCallback(response){
              $scope.status = 'declined';
            },
            function errorCallback(response){}
          );
      },
      function errorCallback(response){$window.alert("Something went wrong...");}
    );
  }

});
