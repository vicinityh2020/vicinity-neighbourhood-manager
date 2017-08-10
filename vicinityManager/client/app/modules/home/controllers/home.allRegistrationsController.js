'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('allRegistrationsController',
  function ($scope,
            $interval,
            $window,
            registrationsAPIService,
            registrationsListService,
            notificationsAPIService,
            Notification) {

// Initialize variables

// ====== Triggers window resize to avoid bug =======
    $(window).trigger('resize');
      $interval(waitTillLoad, 100, 1);
      function waitTillLoad(){
        $(window).trigger('resize');
      }

    $scope.imMobile = Number($window.innerWidth) < 768;
    $(window).on('resize',function(){
      $scope.imMobile = Number($window.innerWidth) < 768;
    });

    $scope.loadedPage = false;
    $scope.regisList = [];
    $scope.rev = false;
    $scope.myOrderBy = 'companyName';

    $scope.myInit = function(){
    registrationsListService.getCompanies()
      .then(
        function successCallback(response){
          $scope.regisList = response.data.message;
          $scope.loadedPage = true;
        },
        function errorCallback(response){}
      );
    };

    $scope.myInit();

// Functions

      $scope.verifyAction = function(reg){
        $scope.id = reg._id;
        registrationsAPIService.putOne(reg._id,{userName: reg.userName, email: reg.email, companyName: reg.companynameReg , type: "newCompany", status: "pending" })
          .then(
            function successCallback(response){
              Notification.success("Verification mail was sent to the company!");
              notificationsAPIService.updateNotificationOfRegistration($scope.id);
              $scope.myInit();
            },
            function errorCallback(response){Notification.error("It was not possible to send the mail...");}
          );
        };

      $scope.declineAction = function(reg){
        $scope.id = reg._id;
        registrationsAPIService.putOne(reg._id,{userName: reg.userName, email: reg.email, companyName: reg.companynameReg, type: "newCompany", status: "declined" })
          .then(
            function successCallback(response){
              Notification.success("Company was rejected!");
              notificationsAPIService.updateNotificationOfRegistration($scope.id);
              $scope.myInit();
            },
            function errorCallback(response){Notification.error("It was not possible to send the mail...");}
          );
        };

      $scope.orderByMe = function(x) {
        if($scope.myOrderBy === x){
          $scope.rev=!($scope.rev);
        }
        $scope.myOrderBy = x;
      };

      $scope.onSort = function(order){
        $scope.rev = order;
      };

  });
