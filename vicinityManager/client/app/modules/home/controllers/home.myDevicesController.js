angular.module('VicinityManagerApp.controllers')
  .controller('myDevicesController', function ($scope,
     $http,
     $window,
     $stateParams,
     $location,
     userAccountAPIService,
     AuthenticationService,
     itemsAPIService,
     Notification)
     {

    $scope.canAnswerNeighbourRequest = false;
    $scope.interruptConnection = false;
    $scope.devices=[];

    $scope.showAllDevices = true;
    $scope.showPrivateDevices = false;
    $scope.showMetaDevices = false;
    $scope.showFriendDevices = false;
    $scope.showPublicDevices = false;
    $scope.loaded = false;
    $scope.noDevices = true;

    userAccountAPIService.getMyDevices($window.sessionStorage.companyAccountId).success(function (data) {
         $scope.devices = data.message;
        //  for (dev in $scope.devices){
        //    itemsAPIService.getItemWithAdd($scope.devices[dev]._id).success(updateScopeAttributes2);     //postupne updatne vsetky devices
        //  }
         if ($scope.devices.length == 0){
           $scope.noDevices = true;
         }else{
           $scope.noDevices = false;
         };

         $scope.loaded = true;
    });

    $scope.allDevices = function (result) {

      $scope.noDevices = true;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showAllDevices = true;

      $scope.searchFilter = function (result) {

        var keyword=new RegExp($window.sessionStorage.companyAccountId);
        if (keyword.test(result.hasAdministrator[0]._id)){
          $scope.noDevices = false;
        };

        return keyword.test(result.hasAdministrator[0]._id) ;
      }
    }

    $scope.privateDevices = function (result) {

      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showPrivateDevices = true;

      $scope.searchFilter = function (result) {

        var keyword=new RegExp(1);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return keyword.test(result.accessLevel) ;
      };

    }

    $scope.metaDevices = function (result) {

      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showMetaDevices = true;
      $scope.searchFilter = function (result) {

        var keyword=new RegExp(2);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return keyword.test(result.accessLevel) ;
      };

    }

    $scope.friendDevices = function (result) {

      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showPublicDevices = false;
      $scope.showFriendDevices = true;

      $scope.searchFilter = function (result) {

        var keyword=new RegExp(3);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return keyword.test(result.accessLevel) ;
      };

    }

    $scope.publicDevices = function (result) {

      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = true;

      $scope.searchFilter = function (result) {

        var keyword=new RegExp(4);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return keyword.test(result.accessLevel) ;
      };

    }


    $scope.searchFilter = function (result) {

      $scope.noDevices = true;
      var keyword=new RegExp($window.sessionStorage.companyAccountId);
      if (keyword.test(result.hasAdministrator[0]._id)){
        $scope.noDevices = false;
      };

      return keyword.test(result.hasAdministrator[0]._id) ;
    }

    $scope.acceptDataRequest = function (dev_id) {
      $scope.interruptConnection= true;
     //  Notification.success("Access request sent!");
      itemsAPIService.acceptDeviceRequest(dev_id).success(function (response) {
        if (response.error ==true) {
            Notification.error("Sending data access request failed!");
        } else {
            Notification.success("Data access approved!");
        };

        itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);

      });
      }

    $scope.rejectDataRequest = function (dev_id) {
       //  Notification.success("Access request sent!");
        itemsAPIService.rejectDeviceRequest(dev_id).success(function (response) {
          if (response.error ==true) {
              Notification.error("Sending data access request failed!");
          } else {
              Notification.success("Data access rejected!");
          };

          itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);

        });
    }


    function updateScopeAttributes2(response){          //response je formatu ako z funkcie getItemWithAdd
      for (dev in $scope.devices){
        if ($scope.devices[dev]._id.toString()===response.message._id.toString()){        //updatne len ten device, ktory potrebujeme
          $scope.devices[dev]=response.message;
        }
      }
        // $scope.name = response.message.organisation;
        // $scope.avatar = response.message.avatar;
        // $scope.occupation = response.message.accountOf.occupation;
        // $scope.organisation = response.message.organisation;
        // $scope.userAccountId = response.message._id;
        // $scope.location = response.message.accountOf.location;
        // $scope.badges = response.message.badges;
        // $scope.notes = response.message.notes;
        // $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
        // $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
        // $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
        // $scope.isNeighbour = response.message.isNeighbour;
        // $scope.friends = response.message.knows;
    }

    // userAccountAPIService.getMyDevices().success(function (response) {
    //   var results = response.message;
    //   $scope.devices = results;
    // });

});
