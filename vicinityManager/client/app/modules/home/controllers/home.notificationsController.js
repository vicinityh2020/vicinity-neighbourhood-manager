"use strict";
angular.module('VicinityManagerApp.controllers')
.controller('notifications',
function ($scope,
          $window,
          $timeout,
          userAccountAPIService,
          notificationsAPIService,
          tokenDecoder,
          itemsHelpers,
          userAccountsHelpers,
          commonHelpers,
          registrationsHelpers,
          Notification) {

  // $scope.me = {};
  $scope.notifs = [];
  $scope.notifs2 = [];
  $scope.registrations = [];
  $scope.registrationsRead = [];
  $scope.oneNotif = false;
  $scope.zeroNotif = false;
  // $scope.numberOfUnread = 0

// ====== Look for new notifications every 5s =======

var promise = {};

$scope.intervalFunction = function(){
  promise = $timeout(function(){
    getNotifsAndNotifs2();
    $scope.intervalFunction();
  }, 5000);
};

$scope.intervalFunction();

$scope.$on('$destroy', function(){
  $timeout.cancel(promise);
  }
);

// Checking if user is devOps =========================

$scope.isDev = false;
var payload = tokenDecoder.deToken();
var keyword = new RegExp('devOps');
$scope.isDev = keyword.test(payload.roles);

// ====== Getting notifications onLoad (read and unread)

  init();

  function init(){
  userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
    .then(getNotifs1, commonHelpers.errorCallback)
    .then(getNotifs2, commonHelpers.errorCallback);
  }

    function getNotifs1(response){
      $scope.notifs = response.data.message;
      return userAccountAPIService.getNotificationsOfUserRead($window.sessionStorage.companyAccountId);
    }

    function getNotifs2(response){
      $scope.notifs2 = response.data.message;
      numberOfUnreadNotifs();
      if($scope.isDev){
        notificationsAPIService.getNotificationsOfRegistration()
          .then(getNotifs3,commonHelpers.errorCallback);
      }else{
        if($scope.notifs.length + $scope.registrations.length !== 0){
          Notification.success('You have ' + String($scope.notifs.length + $scope.registrations.length) + ' new notifications!');
        }
      }
    }

    function getNotifs3(response){
      $scope.registrations = response.data.message;
      numberOfUnreadNotifs();
      if($scope.notifs.length + $scope.registrations.length !== 0){
        Notification.success('You have ' + String($scope.notifs.length + $scope.registrations.length) + ' new notifications!');
      }
      notificationsAPIService.getNotificationsOfRegistrationRead()
        .then(
          function successCallback(response){
            $scope.registrationsRead = response.data.message;
          },
          commonHelpers.errorCallback
        );
      }

      function updateScopeAttributes(response){ // Need to be hoisted
        var index = 0;
        for (index in $scope.notifs){
          if ($scope.notifs[index]._id.toString() === response.data.message._id.toString()){        //updatne len tu notif., ktory potrebujeme
              $scope.notifs[index]=response.data.message;
          }
        }
      }

    // ========= Other Functions ===============

    function numberOfUnreadNotifs(){ // Need to be hoisted
      $scope.oneNotif = ($scope.notifs.length + $scope.registrations.length) === 1;
      $scope.zeroNotif = ($scope.notifs.length + $scope.registrations.length) === 0;
    }

    function getNotifsAndNotifs2(){ // Need to be hoisted
      userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
        .then(getRegistrationNotifications, commonHelpers.errorCallback)
        .then(saveNewRegistrations, commonHelpers.errorCallback);
    }

    function getRegistrationNotifications(response){
      $scope.notifs = response.data.message;
      return notificationsAPIService.getNotificationsOfRegistration();
    }

    function saveNewRegistrations(response){
      $scope.registrations = response.data.message;
      numberOfUnreadNotifs();
    }

    $scope.changeIsUnreadAndResponded =  function(notifID){   // Need to be call external, no need for hoisting
      notificationsAPIService.changeIsUnreadToFalse(notifID)
        .then(notificationsAPIService.changeStatusToResponded(notifID,'responded'), commonHelpers.errorCallback)
        .then(init(), commonHelpers.errorCallback);
    };

      $scope.changeIsUnread =  function(notifID){
        notificationsAPIService.changeIsUnreadToFalse(notifID)
          .then(init(),commonHelpers.errorCallback);
      };

  // Accept / Reject requests ======================

  $scope.acceptNeighbourRequest = function (notifId, friendId){
    userAccountsHelpers.acceptNeighbourRequest(friendId)
    .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), itemsHelpers.errorCallback)
    .then(init(), userAccountsHelpers.errorCallback)
    .catch(userAccountsHelpers.errorCallback);
  };

    $scope.rejectNeighbourRequest = function(notifId, friendId) {
      userAccountsHelpers.rejectNeighbourRequest(friendId)
      .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), itemsHelpers.errorCallback)
      .then(init(),userAccountsHelpers.errorCallback)
      .catch(userAccountsHelpers.errorCallback);
    };

    $scope.acceptDataRequest = function (dev_id, notifId) {
      itemsHelpers.acceptDataRequest(dev_id, notifId)
      .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), itemsHelpers.errorCallback)
      .then(init(),itemsHelpers.errorCallback)
      .catch(itemsHelpers.errorCallback);
    };

    $scope.rejectDataRequest = function (dev_id, notifId) {
      itemsHelpers.rejectDataRequest(dev_id, notifId)
      .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), itemsHelpers.errorCallback)
      .then(init(),itemsHelpers.errorCallback)
      .catch(itemsHelpers.errorCallback);
    };

    $scope.acceptRegistration = function (reg_id, notifId) {
     registrationsHelpers.acceptRegistration(reg_id)
      .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), registrationsHelpers.errorCallback)
      .then(init(),registrationsHelpers.errorCallback)
      .catch(registrationsHelpers.errorCallback);
    };


    $scope.rejectRegistration = function (reg_id, notifId) {
      registrationsHelpers.rejectRegistration(reg_id)
        .then(notificationsAPIService.changeStatusToResponded(notifId,'responded'), registrationsHelpers.errorCallback)
        .then(init(),registrationsHelpers.errorCallback)
        .catch(registrationsHelpers.errorCallback);
    };

  }
);
