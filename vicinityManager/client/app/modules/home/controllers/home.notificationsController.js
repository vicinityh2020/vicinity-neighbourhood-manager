angular.module('VicinityManagerApp.controllers')
.controller('notifications',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, notificationsAPIService, Notification) {

  // $scope.me = {};
  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.oneNotif = false;
  $scope.numberOfUnread = 0;

  // userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId).success(function (data) {
  //   $scope.me = data.message;
  // });

  userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId).success(function (data) {
    $scope.notifs = data.message;
    var index = 0;
    // for (index in $scope.notifs){
    //   if ($scope.notifs[index].isUnread == true){
    //     $scope.numberOfUnread++;
    //   };
    // };
    if ($scope.notifs.length == 1){
      $scope.oneNotif = true;
    };
  });

  userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId).success(function (data) {
    $scope.notifs2 = data.message;
  });

  $scope.changeIsUnread = function (notifID) {
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
