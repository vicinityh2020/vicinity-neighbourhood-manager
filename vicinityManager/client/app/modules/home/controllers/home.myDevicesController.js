angular.module('VicinityManagerApp.controllers')
  .controller('myDevicesController', function ($scope,
     $http,
     $window,
     $stateParams,
     $location,
     userAccountAPIService,
     AuthenticationService,
     Notification)
     {

       userAccountAPIService.getMyDevices($window.sessionStorage.companyAccountId).success(function (data) {
         $scope.devices = data.message;
       });

    $scope.searchFilter = function (result) {

      var keyword=new RegExp($window.sessionStorage.companyAccountId);

      return keyword.test(result.hasAdministrator) ;
    };

    // userAccountAPIService.getMyDevices().success(function (response) {
    //   var results = response.message;
    //   $scope.devices = results;
    // });

     });
