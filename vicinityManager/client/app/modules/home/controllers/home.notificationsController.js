angular.module('VicinityManagerApp.controllers')
.controller('notifications',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, AuthenticationService, notificationsAPIService, tokenDecoder, Notification) {

  // $scope.me = {};
  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.registrations = [];
  $scope.registrationsRead = [];
  $scope.oneNotif = false;
  $scope.zeroNotif = false;
  // $scope.numberOfUnread = 0;

// ======

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

// Checking if user is devOps =========================

$scope.isDev = false;
var payload = tokenDecoder.deToken();
var keyword = new RegExp('devOps');
$scope.isDev = keyword.test(payload.roles);

// ====== Getting notifications onLoad (read and unread)

  userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.notifs = response.data.message;
        userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId)
          .then(
            function successCallback(response){
              $scope.notifs2 = response.data.message;
              $scope.numberOfUnreadNotifs();
              if($scope.isDev){
                notificationsAPIService.getNotificationsOfRegistration()
                  .then(
                    function successCallback(response){
                      $scope.registrations = response.data.message;
                      $scope.numberOfUnreadNotifs();
                      if($scope.notifs.length + $scope.registrations.length !== 0){
                        Notification.success('You have ' + String($scope.notifs.length + $scope.registrations.length) + ' new notifications!')
                      }
                      notificationsAPIService.getNotificationsOfRegistrationRead()
                        .then(
                          function successCallback(response){
                            $scope.registrationsRead = response.data.message;
                          },
                          function errorCallback(response) {
                          }
                        );
                    },
                    function errorCallback(response) {
                    }
                  );
              }else{
                if($scope.notifs.length + $scope.registrations.length !== 0){
                  Notification.success('You have ' + String($scope.notifs.length + $scope.registrations.length) + ' new notifications!')
                }
              }
            },
            function errorCallback(response){
            }
          );
      },
      function errorCallback(response) {
      }
    );


// =========

  $scope.numberOfUnreadNotifs = function(){
    $scope.oneNotif = ($scope.notifs.length + $scope.registrations.length) === 1;
    $scope.zeroNotif = ($scope.notifs.length + $scope.registrations.length) === 0;
  }

  $scope.getNotifsAndNotifs2 = function () {
    userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response){
          $scope.notifs = response.data.message;
          $scope.numberOfUnreadNotifs();
        },
        function errorCallback(response){
        }
      )};

  $scope.changeIsUnread = function (notifID) {
    notificationsAPIService.changeIsUnreadToFalse(notifID)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
        },
        function errorCallback(response){}
      );
  }

  function updateScopeAttributes(response){
    var index = 0;
    for (index in $scope.notifs){
      if ($scope.notifs[index]._id.toString() === response.data.message._id.toString()){        //updatne len tu notif., ktory potrebujeme
          $scope.notifs[index]=response.data.message;
      };
    };
  }

  // function changeIsUnread2(notifID) {
  //   notificationsAPIService.changeIsUnreadToFalse(notifID)
  //   .then(
  //     function successCallback(response){
  //       updateScopeAttributes(response);
  //     },
  //     function errorCallback(response){}
  //   );
  // }


  // userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
  //   .then(
  //     function successCallback(response) {
  //   $scope.notifs = response.data.message;
  //
  //   // $scope.numberOfUnread = 0;
  //
  //   if ($scope.notifs.length == 1){
  //     $scope.oneNotif = true;
  //   };
  //   // if ($scope.notifs[index].isUnread == true){
  //   //   $scope.numberOfUnread++;
  //   // };
  //   },
  //   function errorCallback(response){}
  // );
  //
  // userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId)
  //   .then(
  //     function successCallback(response) {
  //       $scope.notifs2 = response.data.message;
  //     },
  //     function errorCallback(reponse){}
  //   );

// Accept / Reject requests ======================

$scope.acceptNeighbourRequest = function (notifId, friendId) {
    userAccountAPIService.acceptNeighbourRequest(friendId)
        .then(
          function successCallback(response){
            if (response.error) {
                Notification.error("Partnership request acceptation failed :(");
            } else {
                Notification.success("Partnership request accepted!");
            }

            changeIsUnread2(notifId);

            // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
            // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);
        },
        function errorCallback(response){}
      );
}

$scope.rejectNeighbourRequest = function(notifId, friendId) {
    userAccountAPIService.rejectNeighbourRequest(friendId)
        .then(
          function successCallback(response){
            if (response.error) {
                Notification.error("Partnership request rejection failed :(");
            } else {
                Notification.success("Partnership request rejected!");
            }

            changeIsUnread2(notifId);
            // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
        },
          function errorCallback(response){}
      );
    }

$scope.acceptDataRequest = function (dev_id, notifId) {
  // $scope.interruptConnection= true;
 //  Notification.success("Access request sent!");
  itemsAPIService.acceptDeviceRequest(dev_id)
    .then(
      function successCallback(response) {
    if (response.error) {
        Notification.error("Sending data access request failed!");
    } else {
        Notification.success("Data access approved!");
    };
    changeIsUnread2(notifId);
    // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
    },
    function errorCallback(response){}
  );
}

$scope.rejectDataRequest = function (dev_id, notifId) {
   //  Notification.success("Access request sent!");
    itemsAPIService.rejectDeviceRequest(dev_id)
      .then(
        function successCallback(response) {
      if (response.error) {
          Notification.error("Sending data access request failed!");
      } else {
          Notification.success("Data access rejected!");
      };
      changeIsUnread2(notifId);
      // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
    },
    function errorCallback(response){}
  );
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
