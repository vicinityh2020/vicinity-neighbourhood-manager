angular.module('VicinityManagerApp.controllers')
  .controller('neighbourhoodController',
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

       $scope.comps=[];
       $scope.devs=[];
       $scope.cancelRequest= false;
       $scope.cancelAccess= true;
       $scope.onlyPrivateDevices = false;
       $scope.note="Access approved for friends";

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
            var i=0;
            for (dev in $scope.devs){
              itemsAPIService.getItemWithAdd($scope.devs[dev]._id).success(updateScopeAttributes2);     //postupne updatne vsetky devices
              if ($scope.devs[dev].accessLevel > 1){
                i++;
              };
            };
            if (i == 0){
              $scope.onlyPrivateDevices = true;
            }else{
              $scope.onlyPrivateDevices = false;
            };
         });
       }

       $scope.getAccess1 = function (dev_id) {
         $scope.cancelRequest= true;
        //  Notification.success("Access request sent!");
         itemsAPIService.processDeviceAccess(dev_id).success(function (response) {
           if (response.error ==true) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Access request sent!");
           };
          itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
         });
         }

       $scope.cancelRequest1 = function (dev_id) {
         $scope.cancelRequest= false;
        //  Notification.success("Data access request canceled!");
         itemsAPIService.cancelDeviceRequest(dev_id).success(function (response) {
           if (response.error ==true) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Data access request canceled!");
           };
           itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
         });

         }

       $scope.cancelAccess1 = function (dev_id) {
         $scope.cancelAccess= false;
         $scope.note="";

         itemsAPIService.cancelAccess3(dev_id).success(function (response) {
           if (response.error ==true) {
               Notification.error("Try for interruption failed!");
           } else {
               Notification.success("Connection interrupted!");
           };
           itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
         });

         }

       $scope.getAccess2 = function (dev_id) {
         $scope.cancelAccess = true;
         $scope.note="You have acces to data";

         itemsAPIService.getAccess3(dev_id).success(function (response) {
           if (response.error ==true) {
               Notification.error("Get back access failed!");
           } else {
               Notification.success("Connection was renewed!");
           };
           itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
         });
         }

       function updateScopeAttributes2(response){          //response je formatu ako z funkcie getItemWithAdd
        for (dev in $scope.devs){
          if ($scope.devs[dev]._id.toString()===response.message._id.toString()){        //updatne len ten device, ktory potrebujeme
              $scope.devs[dev]=response.message;

          }
        };
       }

    });
