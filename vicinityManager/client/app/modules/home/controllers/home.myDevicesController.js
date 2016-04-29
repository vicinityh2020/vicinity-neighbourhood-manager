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
//id je $scope.id ??

       userAccountAPIService.getMyDevices($window.sessionStorage.userAccountId).success(function (data) {
         $scope.devices = data.message;
       });

    //   $http.get('modules/home/services/data/items.json').success(function(data) {
    //   $scope.devices = data.message;
    // });


     });
