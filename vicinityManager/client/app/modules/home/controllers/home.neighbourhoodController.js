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
       $scope.cancelRequest= false;
       $scope.cancelAccess= true;
       $scope.note="You have acces to data";

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

       $scope.getAccess1 = function () {
         $scope.cancelRequest= true;
         Notification.success("Access request sent!");
         }

       $scope.cancelRequest1 = function () {
         $scope.cancelRequest= false;
         Notification.success("Neighbour request canceled!");
         }

       $scope.cancelAccess1 = function () {
         $scope.cancelAccess= false;
         $scope.note="";
         Notification.success("Connection interrupted!");
         }

       $scope.getAccess2 = function () {
         $scope.cancelAccess = true;
         $scope.note="You have acces to data";
         Notification.success("Connection was renewed!");
         }

    });
