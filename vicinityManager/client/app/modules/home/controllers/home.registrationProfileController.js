'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('registrationProfileController',
function ($scope,
          $window,
          $stateParams,
          $location,
          $interval,
          registrationsAPIService,
          notificationsAPIService,
          Notification) {

  $scope.loaded = false;

  // ====== Triggers window resize to avoid bug =======
      $(window).trigger('resize');
        $interval(waitTillLoad, 100, 1);
        function waitTillLoad(){
          $(window).trigger('resize');
        }

  registrationsAPIService.getOne($stateParams.registrationId)
    .then(
      function successCallback(response){
        updateScopeAttributes(response);
        $scope.loaded = true;
      },
      errorCallback
    );

  function updateScopeAttributes(response){
      $scope.id = response.data.message._id;
      $scope.companyName = response.data.message.companyName;
      $scope.location = response.data.message.companyLocation;
      $scope.businessId = response.data.message.businessId;
      if(!$scope.businessId){
        $scope.businessId = "Not provided";
      }
      $scope.status = response.data.message.status;
  }

  $scope.verifyAction = function(){
  registrationsAPIService.putOne($scope.id,{status: "pending" })
    .then(verifyCallback,errorCallback);
  };

  $scope.declineAction = function(){
  registrationsAPIService.putOne($scope.id,{status: "declined" })
    .then(declineCallback,errorCallback);
  };

  function verifyCallback(response){
    Notification.success("Verification mail was sent to the company!");
    $scope.status = 'pending';
    notificationsAPIService.updateNotificationOfRegistration($scope.id);
    }

  function declineCallback(response){
    Notification.success("Company was rejected!");
    $scope.status = 'declined';
    notificationsAPIService.updateNotificationOfRegistration($scope.id);
    }

  function errorCallback(err){
    Notification.warning("Something went wrong...");
  }

});
