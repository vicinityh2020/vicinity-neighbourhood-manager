"use strict";
angular.module('VicinityManagerApp.controllers')
.controller('notifications', 'configuration',
function ($scope,
          $window,
          $timeout,
          $state,
          notificationsAPIService,
          userAccountsHelpers,
          commonHelpers,
          registrationsHelpers,
          configuration,
          Notification) {

  $scope.userId = $window.sessionStorage.userAccountId;
  $scope.orgId = $window.sessionStorage.companyAccountId;
  $scope.notifs = [];
  $scope.notifCount = 0;
  $scope.zeroNotif = true;
  $scope.loaded = false;

// ====== Look for new notifications every X seconds =======

var promise = {};

$scope.intervalFunction = function(){
  promise = $timeout(function(){
    refresh();
    $scope.intervalFunction();
  }, configuration.notificationTimeout);
};

$scope.intervalFunction();

$scope.$on('$destroy', function(){
  $timeout.cancel(promise);
  }
);

// ====== Getting notifications onLoad (read and unread)

  init();

  function init(){
    $scope.loaded = false;
    $scope.tempNotifs = [];
    // params (limit, offset, all)
    notificationsAPIService.getNotifications(8, 0, false)
    .then(getNotifs)
    .catch(function(err){
      // console.log(err);
      // Notification.error("Server error");
    });
  }

  function getNotifs(response){
    try{
      $scope.notifs = response.data.message.notifications;
      $scope.notifCount = response.data.message.count;
      $scope.zeroNotif = Number($scope.notifCount) === 0;
      sortNotifs();
      $scope.loaded = true;
    } catch(err) {
      console.log(err);
      Notification.warning("Notifications could not be processed");
      $timeout.cancel(promise);
    }
  }

  function refresh(){
    notificationsAPIService.refreshNotifications()
    .then(function(response){
      $scope.notifCount = response.data.message.count;
      $scope.zeroNotif = Number($scope.notifCount) === 0;
    })
    .catch(function(err){
      console.log(err);
    });
  }

    // ========= Other Functions ===============

    $scope.changeIsUnreadAndResponded = function(notifID){
      notificationsAPIService.changeIsUnreadToFalse(notifID)
        .then(notificationsAPIService.changeStatusToResponded(notifID,'responded'))
        .then(init())
        .catch(function(err){
          console.log(err);
          Notification.error("Server error");
        });
    };

    $scope.changeIsUnread = function(notifID){
      $scope.notifCount = $scope.notifCount - 1;
      notificationsAPIService.changeIsUnreadToFalse(notifID)
        .then(init())
        .catch(function(err){
          console.log(err);
          Notification.error("Server error");
        });
    };

    $scope.seeAll = function(){
      $state.go('root.main.myNotifications');
    };

    function sortNotifs(){
      $scope.notifs.sort(function(a,b){
        return b.date - a.date;
      });
    }

  // Accept / Reject requests ======================

  $scope.acceptNeighbourRequest = function (notifId, friendId){
    $scope.notifCount = $scope.notifCount - 1;
    userAccountsHelpers.acceptNeighbourRequest(friendId)
    .then(init)
    .catch(function(err){
      console.log(err);
      Notification.error("Error accepting neighbour request");
    });
  };

    $scope.rejectNeighbourRequest = function(notifId, friendId){
      $scope.notifCount = $scope.notifCount - 1;
      userAccountsHelpers.rejectNeighbourRequest(friendId)
      .then(init)
      .catch(function(err){
        console.log(err);
        Notification.error("Error rejecting neighbour request");
      });
    };

    $scope.acceptRegistration = function (notifId, reg_id) {
      $scope.notifCount = $scope.notifCount - 1;
      registrationsHelpers.acceptRegistration(reg_id, notifId)
        .then(init)
        .catch(function(err){
          console.log(err);
          Notification.error("Error accepting registration");
        });
    };

    $scope.rejectRegistration = function (notifId, reg_id) {
      $scope.notifCount = $scope.notifCount - 1;
      registrationsHelpers.rejectRegistration(reg_id, notifId)
        .then(init)
        .catch(function(err){
          console.log(err);
          Notification.error("Error rejecting registration");
        });
    };

  }
);
