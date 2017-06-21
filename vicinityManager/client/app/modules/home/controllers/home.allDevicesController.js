angular.module('VicinityManagerApp.controllers')
  .controller('allDevicesController',
   function ($scope,
     $window,
     $stateParams,
     $location,
     userAccountAPIService,
     itemsAPIService,
     AuthenticationService,
     $http,
     Notification)
     {

// Initialize variables and get initial data =============

       $scope.comps=[];
       $scope.devs=[];
       $scope.cancelRequest= false;
       $scope.cancelAccess= true;
       $scope.onlyPrivateDevices = false;
       $scope.note="Access for friends";
       $scope.isF = 0;
       $scope.loaded = false;
       $scope.myId = $window.sessionStorage.companyAccountId;

      userAccountAPIService.getAllDevices($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response){
        $scope.devs = response.data.message;

        // $scope.getNeigh = true;
        // $scope.getAdd = false;
        var i=0;
        for (dev in $scope.devs){
          // updateDev($scope.devs[dev]);
          // itemsAPIService.getItemWithAdd($scope.devs[dev]._id).success(updateScopeAttributes2);     //postupne updatne vsetky devices
          if ($scope.devs[dev].accessLevel > 1){
            i++;
          };
        };
        if (i == 0){
          $scope.onlyPrivateDevices = true;
        }else{
          $scope.onlyPrivateDevices = false;
        };
        $scope.loaded = true;
      },
      function errorCallback(response){
      }
    );

// Manage access request functions =====================

       $scope.getAccess1 = function(dev_id) {
         $scope.cancelRequest = true;
        //  Notification.success("Access request sent!");
         itemsAPIService.processDeviceAccess(dev_id)
          .then(
            function successCallback(response){
           if (response.error) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Access request sent!");
           };
          itemsAPIService.getItemWithAdd(dev_id)
          .then(
            function successCallback(response){
              updateScopeAttributes(response);
            },
            function errorCallback(response){}
            );
          },
          function errorCallback(response){}
        );
      }

       $scope.cancelRequest1 = function(dev_id) {
         $scope.cancelRequest= false;
        //  Notification.success("Data access request canceled!");
         itemsAPIService.cancelDeviceRequest(dev_id)
         .then(
          function successCallback(response) {
           if (response.error) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Data access request canceled!");
           };
           itemsAPIService.getItemWithAdd(dev_id)
            .then(
              function successCallback(response){
                updateScopeAttributes(response);
              },
              function errorCallback(response){}
            );
         },
         function errorCallback(){}
        );
      }

       $scope.cancelAccess1 = function(dev_id) {
         $scope.cancelAccess = false;
         $scope.note = "";

         itemsAPIService.cancelAccess(dev_id)
          .then(
            function successCallback(response) {
           if (response.error) {
               Notification.error("Try for interruption failed!");
           } else {
               Notification.success("Connection interrupted!");
           };
           itemsAPIService.getItemWithAdd(dev_id)
           .then(
             function successCallback(response){
               updateScopeAttributes(response);
             },
             function errorCallback(response){}
           );
         },
         function errorCallback(response){}
       );
      }

       $scope.getAccess2 = function(dev_id) {
         $scope.cancelAccess = true;
         $scope.note = "You have acces to data";

         itemsAPIService.getAccess(dev_id)
          .then(
            function successCallback(response) {
           if (response.error) {
               Notification.error("Get back access failed!");
           } else {
               Notification.success("Connection was renewed!");
           };
           itemsAPIService.getItemWithAdd(dev_id)
           .then(
             function successCallback(response){
               updateScopeAttributes(response);
             },
             function errorCallback(response){}
           );
         },
         function errorCallback(response){}
       );
      }

       function updateScopeAttributes(response){          //response je formatu ako z funkcie getItemWithAdd
        for (dev in $scope.devs){
          if ($scope.devs[dev]._id.toString()===response.data.message._id.toString()){        //updatne len ten device, ktory potrebujeme
              $scope.devs[dev]=response.data.message;
              // $scope.getNeigh = false;
              // $scope.getAdd = true;
          }
        };
       }

// Custom filters =================

  $scope.searchFilterOnline = function (result) {

    var keyword = new RegExp($scope.searchTerm2, 'i');

    return ((keyword.test(result.hasAdministrator[0].organisation) || keyword.test(result.name)) && $scope.searchTerm2 && result.info.status === "On");      //|| !$scope.searchTerm2
  }

  $scope.searchFilterOffline = function (result) {

    var keyword = new RegExp($scope.searchTerm2, 'i');

    return ((keyword.test(result.hasAdministrator[0].organisation) || keyword.test(result.name)) && $scope.searchTerm2 && result.info.status === "Off");      //|| !$scope.searchTerm2
  }

  $scope.searchFilterUnknown = function (result) {

    var keyword = new RegExp($scope.searchTerm2, 'i');

    return ((keyword.test(result.hasAdministrator[0].organisation) || keyword.test(result.name)) && $scope.searchTerm2 && result.info.status === "Unknown");      //|| !$scope.searchTerm2
  }

  $scope.offline2 = function (result) {

    // var keyword = new RegExp($scope.searchTerm2, 'i');

    return (result.info.status === "Off" && !$scope.searchTerm2);
  }

  $scope.online2 = function (result) {

    // var keyword = new RegExp($scope.searchTerm2, 'i');

    return (result.info.status === "On" && !$scope.searchTerm2);
  }

  $scope.unknown2 = function (result) {

    // var keyword = new RegExp($scope.searchTerm2, 'i');

    return (result.info.status === "Unknown" && !$scope.searchTerm2);
  }

});
