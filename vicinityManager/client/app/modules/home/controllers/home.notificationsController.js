"use strict";
angular.module('VicinityManagerApp.controllers')
.controller('notifications',
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

  refresh();

  $scope.init = function(){
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
      formatDate();
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

    $scope.seeAll = function(){
      $state.go('root.main.myNotifications');
    };

    function formatDate(){
      var date, day, month, year, hours, minutes;
      // var monthNames = [
      //   "January", "February", "March",
      //   "April", "May", "June", "July",
      //   "August", "September", "October",
      //   "November", "December"
      // ];
      for(var i = 0, l = $scope.notifs.length; i<l ; i++){
        date = new Date($scope.notifs[i].date);
        $scope.notifs[i].timestamp = date;
        day = date.getDate();
        month = date.getMonth() + 1;
        year = date.getFullYear();
        hours = date.getHours();
        minutes = date.getMinutes() / 10 < 1 ? "0" + date.getMinutes() : date.getMinutes();
        $scope.notifs[i].date = day + "/" + month + "/" + year + "  " + hours + ":" + minutes;
      }
    }

    function sortNotifs(){
      $scope.notifs.sort(function(a,b){
        return b.timestamp - a.timestamp;
      });
    }

  // Accept / Reject requests ======================

  $scope.acceptNeighbourRequest = function (notifId, friendId){
    userAccountsHelpers.acceptNeighbourRequest(friendId)
    .then(init)
    .catch(function(err){
      console.log(err);
      Notification.error("Error accepting neighbour request");
    });
  };

    $scope.rejectNeighbourRequest = function(notifId, friendId){
      userAccountsHelpers.rejectNeighbourRequest(friendId)
      .then(init)
      .catch(function(err){
        console.log(err);
        Notification.error("Error rejecting neighbour request");
      });
    };

    $scope.acceptRegistration = function (notifId, reg_id) {
      registrationsHelpers.acceptRegistration(reg_id, notifId)
        .then(init)
        .catch(function(err){
          console.log(err);
          Notification.error("Error accepting registration");
        });
    };

    $scope.rejectRegistration = function (notifId, reg_id) {
      registrationsHelpers.rejectRegistration(reg_id, notifId)
        .then(init)
        .catch(function(err){
          console.log(err);
          Notification.error("Error rejecting registration");
        });
    };

  }
);
