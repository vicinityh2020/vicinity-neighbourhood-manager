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
          Notification) {

  $scope.userId = $window.sessionStorage.userAccountId;
  $scope.orgId = $window.sessionStorage.companyAccountId;
  $scope.notifs = [];
  $scope.tempNotifs = [];
  $scope.notifCount = 0;
  $scope.oneNotif = false;
  $scope.zeroNotif = false;
  $scope.newNotifs = false;
  // $scope.numberOfUnread = 0

// ====== Look for new notifications every 5s =======

var promise = {};

$scope.intervalFunction = function(){
  promise = $timeout(function(){
    init();
    $scope.intervalFunction();
  }, 10000);
};

$scope.intervalFunction();

$scope.$on('$destroy', function(){
  $timeout.cancel(promise);
  }
);

// ====== Getting notifications onLoad (read and unread)

  init();

  function init(){
    $scope.tempNotifs = [];
    notificationsAPIService.getNotifications(null, null)
    .then(getNotifs)
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });
  }

  function getNotifs(response){
    try{
      $scope.tempNotifs = response.data.message;
      numberOfUnreadNotifs();
      if($scope.notifCount < $scope.tempNotifs.length){
        var count = Number($scope.tempNotifs.length) - $scope.notifCount;
        Notification.success('You have ' + String($scope.tempNotifs.length) + ' new notifications!');
      }
      sortNotifs();
      $scope.notifCount = $scope.notifs.length;
    } catch(err) {
      console.log(err);
      Notification.warning("Notifications could not be processed");
      $timeout.cancel(promise);
    }
  }

    // ========= Other Functions ===============

    function numberOfUnreadNotifs(){ // Need to be hoisted
      $scope.oneNotif = $scope.notifs.length === 1;
      $scope.zeroNotif = $scope.notifs.length === 0;
    }

    $scope.changeIsUnreadAndResponded = function(notifID){   // Need to be call external, no need for hoisting
      $scope.notifCount = $scope.notifCount - 1;
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
      $scope.notifCount = 0;
      var allNotifs = [];
      retrieveAllNotifs($scope.notifs, allNotifs);
      notificationsAPIService.changeIsUnreadToFalse('0',{ids: allNotifs})
        .then(function(){
          init();
        })
        .catch(function(err){
          console.log(err);
          Notification.error("Server error");
        });
      $state.go('root.main.myNotifications');
    };

    function retrieveAllNotifs(array, allNotifs){
      for (var index in array){
        allNotifs.push(array[index]._id.toString());
      }
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

    // ========= Time related functions ===============

    function sortNotifs(){
      $scope.notifs = [];
      angular.forEach($scope.tempNotifs,
        function(n) {
          if(n._id){
            var timestamp = n._id.toString().substring(0,8);
            var date = new Date(parseInt( timestamp, 16 ) * 1000 );
            n.timestamp = moment(date);
          }
          $scope.notifs.push(n);
         }
      );
      $scope.notifs.sort(function(a,b){
        return b.timestamp - a.timestamp;
      });
    }

  }
);
