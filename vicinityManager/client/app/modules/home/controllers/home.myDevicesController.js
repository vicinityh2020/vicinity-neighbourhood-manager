angular.module('VicinityManagerApp.controllers')
  .controller('myDevicesController', ['$scope','$http',
   function ($scope,
     $http,
     $window,
     $stateParams,
     $location,
     userAccountAPIService,
     AuthenticationService,
     Notification)
     {
      $http.get('modules/home/services/data/items.json').success(function(data) {
      $scope.devices = data.message;
    });

// data.message ??

     }]);
