angular.module('VicinityManagerApp.controllers')
.controller('notifications',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, AuthenticationService, notificationsAPIService, Notification) {

  // $scope.me = {};
  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.oneNotif = false;
  $scope.zeroNotif = false;
  $scope.numberOfUnread = 0;

  // userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (data) {
  //   $scope.me = data.message;
  // });

var promise = {};

$scope.$on('$destroy', function(){
    $timeout.cancel(promise);
});

// $scope.$on('$locationChangeStart', function(){
//     $timeout.cancel(promise);
// });

  $scope.intervalFunction = function(){
     promise = $timeout(function() {
      $scope.getNotifsAndNotifs2();
      $scope.intervalFunction();
    }, 5000)
  }

  $scope.intervalFunction();

  $scope.$on('$destroy', function(){
      $timeout.cancel(promise);
  });

  userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.notifs = response.data.message;
        var index = 0;
        // for (index in $scope.notifs){
        //   if ($scope.notifs[index].isUnread == true){
        //     $scope.numberOfUnread++;
        //   };
        // };
        if ($scope.notifs.length === 1){
          $scope.oneNotif = true;
        }else{
          $scope.oneNotif = false;
        };
        if ($scope.notifs.length === 0){
          $scope.zeroNotif = true;
        }else{
          $scope.zeroNotif = false};
      },
      function errorCallback(response) {
      }
    );




  userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.notifs2 = response.data.message;
      },
      function errorCallback(response){
      }
    );


  $scope.getNotifsAndNotifs2 = function () {
    userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response){
          $scope.notifs = response.data.message;
          var index = 0;
          // for (index in $scope.notifs){
          //   if ($scope.notifs[index].isUnread == true){
          //     $scope.numberOfUnread++;
          //   };
          // };
          if ($scope.notifs.length == 1){
            $scope.oneNotif = true;
          }else{
            $scope.oneNotif = false;
          };
          if ($scope.notifs.length == 0){
            $scope.zeroNotif = true;
          }else{
            $scope.zeroNotif = false;
          };
        },
        function errorCallback(response){
        }
      )};



    userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(resource) {
          $scope.notifs2 = resource.data.message;
        },
        function errorCallback(resource){
        }
      );

  $scope.changeIsUnread = function (notifID) {
    notificationsAPIService.changeIsUnreadToFalse(notifID).success(updateScopeAttributes);

  }

  function changeIsUnread2(notifID) {
    notificationsAPIService.changeIsUnreadToFalse(notifID).success(updateScopeAttributes);

  }

function updateScopeAttributes(response){
  var index = 0;
  for (index in $scope.notifs){
    if ($scope.notifs[index]._id.toString() === response.message._id.toString()){        //updatne len tu notif., ktory potrebujeme
        $scope.notifs[index]=response.message;
    };

  };
  userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId).success(function (data) {
    $scope.notifs = data.message;

    // $scope.numberOfUnread = 0;

    if ($scope.notifs.length == 1){
      $scope.oneNotif = true;
    };
    // if ($scope.notifs[index].isUnread == true){
    //   $scope.numberOfUnread++;
    // };
  });

  userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId).success(function (data) {
    $scope.notifs2 = data.message;
  });
}

$scope.acceptNeighbourRequest = function (notifId, friendId) {
    userAccountAPIService.acceptNeighbourRequest(friendId)
        .success(function(response){
            if (response.error == true) {
                Notification.error("Partnership request acceptation failed :(");
            } else {
                Notification.success("Partnership request accepted!");
            }

            changeIsUnread2(notifId);

            // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
            // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);

        });
}

$scope.rejectNeighbourRequest = function(notifId, friendId) {
    userAccountAPIService.rejectNeighbourRequest(friendId)
        .success(function(response){
            if (response.error ==true) {
                Notification.error("Partnership request rejection failed :(");
            } else {
                Notification.success("Partnership request rejected!");
            }

            changeIsUnread2(notifId);
            // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
        });
}

$scope.acceptDataRequest = function (dev_id, notifId) {
  // $scope.interruptConnection= true;
 //  Notification.success("Access request sent!");
  itemsAPIService.acceptDeviceRequest(dev_id).success(function (response) {
    if (response.error ==true) {
        Notification.error("Sending data access request failed!");
    } else {
        Notification.success("Data access approved!");
    };

    changeIsUnread2(notifId);
    // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);

  });
  }

$scope.rejectDataRequest = function (dev_id, notifId) {
   //  Notification.success("Access request sent!");
    itemsAPIService.rejectDeviceRequest(dev_id).success(function (response) {
      if (response.error ==true) {
          Notification.error("Sending data access request failed!");
      } else {
          Notification.success("Data access rejected!");
      };

      changeIsUnread2(notifId);
      // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);

    });
}

$scope.searchFilter1 = function (result) {

  return (result.type.toString() === 'deviceRequest' && result.status.toString() === 'waiting');
}

$scope.searchFilter2 = function (result) {

  return (result.type.toString() === 'friendRequest' && result.status.toString() === 'waiting');
}

$scope.searchFilter3 = function (result) {

  return (result.type.toString() === 'deviceRequest' && result.status.toString() === 'accepted');
}

$scope.searchFilter4 = function (result) {

  return (result.type.toString() === 'friendRequest' && result.status.toString() === 'accepted');
}

// function updateScopeAttributes2(response){
//     $scope.name = response.message.organisation;
//     $scope.avatar = response.message.avatar;
//     $scope.occupation = response.message.accountOf.occupation;
//     $scope.organisation = response.message.organisation;
//     $scope.companyAccountId = response.message._id;
//     $scope.location = response.message.accountOf.location;
//     $scope.badges = response.message.badges;
//     $scope.notes = response.message.notes;
//     $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
//     $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
//     $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
//     $scope.isNeighbour = response.message.isNeighbour;
//     $scope.friends = response.message.knows;
//     $scope.users = response.message.accountOf;
// };

// $scope.searchFilter3 = function (result) {
//
//   return (result.type.toString() === 'deviceRequest');
// }
//
// $scope.searchFilter4 = function (result) {
//
//   return (result.type.toString() === 'friendRequest');
// }



});
