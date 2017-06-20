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

// Initialize variables and retrieve initial data -----------------

    $scope.canAnswerNeighbourRequest = false;
    $scope.interruptConnection = false;
    $scope.devices=[];
    $scope.note = ""; //"My devices";

    $scope.showAllDevices = true;
    $scope.showPrivateDevices = false;
    $scope.showMetaDevices = false;
    $scope.showFriendDevices = false;
    $scope.showPublicDevices = false;
    $scope.loaded = false;
    $scope.noDevices = true;

    userAccountAPIService.getMyDevices($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response) {
           $scope.devices = response.data.message;
          //  for (dev in $scope.devices){
          //    itemsAPIService.getItemWithAdd($scope.devices[dev]._id).success(updateScopeAttributes2);     //postupne updatne vsetky devices
          //  }
           if ($scope.devices.length == 0){
             $scope.noDevices = true;
           }else{
             $scope.noDevices = false;
           };

           $scope.loaded = true;
         },
         function errorCallback(response){
         }
       );

// Filters -------------------------------------------------------

    $scope.searchFilterOnline = function (result) {

      $scope.noDevices = true;
      var keyword=new RegExp($window.sessionStorage.companyAccountId);
      if (keyword.test(result.hasAdministrator[0]._id)){
        $scope.noDevices = false;
      };

      return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "On")) ;
    }

    $scope.searchFilterOffline = function (result) {

      $scope.noDevices = true;
      var keyword=new RegExp($window.sessionStorage.companyAccountId);
      if (keyword.test(result.hasAdministrator[0]._id)){
        $scope.noDevices = false;
      };

      return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "Off")) ;
    }

    $scope.searchFilterUnknown = function (result) {

      $scope.noDevices = true;
      var keyword=new RegExp($window.sessionStorage.companyAccountId);
      if (keyword.test(result.hasAdministrator[0]._id)){
        $scope.noDevices = false;
      };

      return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "Unknown")) ;
    }

// Different views (Dropdown) --------------------------------------

    $scope.allDevices = function (result) {

      $scope.noDevices = true;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showAllDevices = true;

      $scope.searchFilterOnline = function (result) {

        $scope.noDevices = true;
        var keyword=new RegExp($window.sessionStorage.companyAccountId);
        if (keyword.test(result.hasAdministrator[0]._id)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "On")) ;
      };

      $scope.searchFilterOffline = function (result) {

        $scope.noDevices = true;
        var keyword=new RegExp($window.sessionStorage.companyAccountId);
        if (keyword.test(result.hasAdministrator[0]._id)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "Off")) ;
      };

      $scope.searchFilterUnknown = function (result) {

        $scope.noDevices = true;
        var keyword=new RegExp($window.sessionStorage.companyAccountId);
        if (keyword.test(result.hasAdministrator[0]._id)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.hasAdministrator[0]._id) && (result.info.status === "Unknown")) ;
      };
    }

    $scope.privateDevices = function (result) {

      $scope.note = "My private devices";
      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showPrivateDevices = true;

      $scope.searchFilterOnline1 = function (result) {

        var keyword=new RegExp(1);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "On")) ;
      };

      $scope.searchFilterOffline1 = function (result) {

        var keyword=new RegExp(1);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Off")) ;
      };

      $scope.searchFilterUnknown1 = function (result) {

        var keyword=new RegExp(1);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Unknown")) ;
      };

    }

    $scope.metaDevices = function (result) {

      $scope.note = "Metada of listed devices are shared with my partners";
      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = false;
      $scope.showMetaDevices = true;

      $scope.searchFilterOnline2 = function (result) {

        var keyword=new RegExp(2);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "On")) ;
      };

      $scope.searchFilterOffline2 = function (result) {

        var keyword=new RegExp(2);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Off")) ;
      };

      $scope.searchFilterUnknown2 = function (result) {

        var keyword=new RegExp(2);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Unknown")) ;
      };

    }

    $scope.friendDevices = function (result) {

      $scope.note = "Listed devices are shared with my partners";
      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showPublicDevices = false;
      $scope.showFriendDevices = true;

      $scope.searchFilterOnline3 = function (result) {

        var keyword=new RegExp(3);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "On")) ;
      };

      $scope.searchFilterOffline3 = function (result) {

        var keyword=new RegExp(3);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Off")) ;
      };

      $scope.searchFilterUnknown3 = function (result) {

        var keyword=new RegExp(3);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Unknown")) ;
      };

    }

    $scope.publicDevices = function (result) {

      $scope.note = "My public devices";
      $scope.noDevices = true;
      $scope.showAllDevices = false;
      $scope.showPrivateDevices = false;
      $scope.showMetaDevices = false;
      $scope.showFriendDevices = false;
      $scope.showPublicDevices = true;

      $scope.searchFilterOnline4 = function (result) {

        var keyword=new RegExp(4);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "On")) ;
      };

      $scope.searchFilterOffline4 = function (result) {

        var keyword=new RegExp(4);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Off")) ;
      };

      $scope.searchFilterUnknown4 = function (result) {

        var keyword=new RegExp(4);
        if (keyword.test(result.accessLevel)){
          $scope.noDevices = false;
        };

        return (keyword.test(result.accessLevel) && (result.info.status === "Unknown")) ;
      };

    }


// REQUESTS -----------------------------------------------


    $scope.acceptDataRequest = function (dev_id) {
      $scope.interruptConnection = true;
     //  Notification.success("Access request sent!");
      itemsAPIService.acceptDeviceRequest(dev_id)
        .then(
          function successCallback(response){
            if (response.data.error == true) {
                Notification.error("Sending data access request failed!");
            } else {
                Notification.success("Data access approved!");
            };

            itemsAPIService.getItemWithAdd(dev_id)
              .then(
                function successCallback(response){
                  updateScopeAttributes2(response);
                },
                function errorCallback(response){
                }
            );
          },
          function errorCallback(response){
          }
        );
      }

    $scope.rejectDataRequest = function (dev_id) {
       //  Notification.success("Access request sent!");
        itemsAPIService.rejectDeviceRequest(dev_id)
          .then(
            function successCallback(response) {
          if (response.data.error == true) {
              Notification.error("Sending data access request failed!");
          } else {
              Notification.success("Data access rejected!");
          };

          itemsAPIService.getItemWithAdd(dev_id)
            .then(
              function successCallback(response){
                updateScopeAttributes2(response);
              },
              function errorCallback(response){
              }
          );
        },
        function errorCallback(response){
        }
      );
    }


    function updateScopeAttributes2(response){          //response je formatu ako z funkcie getItemWithAdd
      for (dev in $scope.devices){
        if ($scope.devices[dev]._id.toString()===response.data.message._id.toString()){        //updatne len ten device, ktory potrebujeme
          $scope.devices[dev]=response.data.message;
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
