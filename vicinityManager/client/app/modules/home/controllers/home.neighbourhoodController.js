angular.module('VicinityManagerApp.controllers')
  .controller('neighbourhoodController',
   function ($scope,
     $window,
     $stateParams,
     $location,
     userAccountAPIService,
     AuthenticationService,
     $http,
     Notification)
     {

       $scope.comps=[];
       $scope.devs=[];
       $scope.activeConnection= false;
       $scope.cancelRequest= false;
      //  $scope.notPrivate= true;

      //  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (data) {
      //    $scope.comps = data.message.knows;
      //  });
       //
      //  userAccountAPIService.getUserAccountProfile().success(function (response) {
      //    var results = response.message.knows;
      //    $scope.comps = results;
      //  });

       userAccountAPIService.getFriends($window.sessionStorage.companyAccountId).success(function (data) {
         $scope.comps = data.message;
       });

      //  for (i = 0; i < $scope.comps.length; i++) {
      //    userAccountAPIService.getMyDevices($scope.comps[i]._id).success(function (data) {
      //      $scope.comps[i].devs = data.message;
      //    });
      //  }

       $scope.getDevices = function (id) {
         userAccountAPIService.getMyDevices(id).success(function(response) {
            $scope.devs=response.message;
         });
       }

       $scope.getAccess = function () {
         $scope.cancelRequest= true;
         }

       $scope.cancelRequest = function () {
         $scope.cancelRequest= false;
         }

       );
       }


    });
