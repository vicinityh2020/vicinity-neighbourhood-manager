"use strict";
angular.module('VicinityManagerApp.controllers')
.controller('notifications',
function ($scope, $window,  $timeout, userAccountAPIService, itemsAPIService, notificationsAPIService, tokenDecoder, registrationsAPIService, Notification) {

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
    getNotifsAndNotifs();
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
    .then(getNotifs1,errorCallback)
    .then(getNotifs2,errorCallback);
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
          .then(getNotifs3,errorCallback);
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
          errorCallback
        );
      }

    function errorCallback(err){
      Notification.error('Error with notifications  ' + err);
    }

    // ========= Other Functions ===============

    function numberOfUnreadNotifs(){ // Need to be hoisted
      $scope.oneNotif = ($scope.notifs.length + $scope.registrations.length) === 1;
      $scope.zeroNotif = ($scope.notifs.length + $scope.registrations.length) === 0;
    }

    function getNotifsAndNotifs(){ // Need to be hoisted
      userAccountAPIService.getNotificationsOfUser($window.sessionStorage.companyAccountId)
        .then(getRegistrationNotifications,errorCallback)
        .then(saveNewRegistrations,errorCallback);
    }

    function getRegistrationNotifications(response){
      $scope.notifs = response.data.message;
      return notificationsAPIService.getNotificationsOfRegistration();
    }

    function saveNewRegistrations(response){
      $scope.registrations = response.data.message;
      numberOfUnreadNotifs();
    }

    $scope.notifResponded =  function(notifID,answer){   // Need to be call external, no need for hoisting
      notificationsAPIService.changeStatusToResponded(notifID,answer)
        .then(
          function successCallback(response){
            // updateScopeAttributes(response);
            init();
          },
          errorCallback
        );
      };

      $scope.changeIsUnreadAndResponded =  function(notifID){   // Need to be call external, no need for hoisting
        notificationsAPIService.changeIsUnreadToFalse(notifID)
          .then($scope.notifResponded(notifID,'responded'), errorCallback);
        };

      $scope.changeIsUnread =  function(notifID){
        notificationsAPIService.changeIsUnreadToFalse(notifID)
          .then(
            function successCallback(response){
              init();
              // updateScopeAttributes(response);
            },
            errorCallback
          );
      };

      function updateScopeAttributes(response){ // Need to be hoisted
        var index = 0;
        for (index in $scope.notifs){
          if ($scope.notifs[index]._id.toString() === response.data.message._id.toString()){        //updatne len tu notif., ktory potrebujeme
              $scope.notifs[index]=response.data.message;
          }
        }
      }

  // Accept / Reject requests ======================

  $scope.acceptNeighbourRequest = function (notifId, friendId){
    userAccountAPIService.acceptNeighbourRequest(friendId)
        .then(
          function successCallback(response){
            if (response.error) {
                Notification.error("Partnership request acceptation failed :(");
            } else {
                Notification.success("Partnership request accepted!");
            }

            $scope.notifResponded(notifId,'responded');

            // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
            // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);
        },
        errorCallback
      );
    };

    $scope.rejectNeighbourRequest = function(notifId, friendId) {
      userAccountAPIService.rejectNeighbourRequest(friendId)
          .then(
            function successCallback(response){
              if (response.error) {
                  Notification.error("Partnership request rejection failed :(");
              } else {
                  Notification.success("Partnership request rejected!");
              }

              $scope.notifResponded(notifId,'responded');
              // userAccountAPIService.getUserAccountProfile(friendId).success(updateScopeAttributes2);
          },
          errorCallback
        );
      };

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
        }
        $scope.notifResponded(notifId,'responded');
        // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
        },
        errorCallback
      );
    };

    $scope.rejectDataRequest = function (dev_id, notifId) {
       //  Notification.success("Access request sent!");
        itemsAPIService.rejectDeviceRequest(dev_id)
          .then(
            function successCallback(response) {
          if (response.error) {
              Notification.error("Sending data access request failed!");
          } else {
              Notification.success("Data access rejected!");
          }
          $scope.notifResponded(notifId,'responded');
          // itemsAPIService.getItemWithAdd(dev_id).success(updateScopeAttributes2);
        },
        errorCallback
      );
    };

    $scope.acceptRegistration = function (reg_id, notifId) {
     registrationsAPIService.putOne(reg_id, {status: "pending" })
       .then(verifyCallback(notifId),errorCallback);
      };


    $scope.rejectRegistration = function (reg_id, notifId) {
      registrationsAPIService.putOne(reg_id, {status: "declined" })
        .then(declineCallback(notifId),errorCallback);
    };

    function verifyCallback(notifId){
      Notification.success("Verification mail was sent to the company!");
      $scope.notifResponded(notifId,'responded');
    }

    function declineCallback(notifId){
      Notification.success("Company was rejected!");
      $scope.notifResponded(notifId,'responded');
    }

    // Custom filters ============
    //
    // $scope.searchFilter1 = function (result) {
    //
    //   return (result.type.toString() === 'deviceRequest' && result.status.toString() === 'waiting');
    // };
    //
    // $scope.searchFilter2 = function (result) {
    //
    //   return (result.type.toString() === 'friendRequest' && result.status.toString() === 'waiting');
    // };
    //
    // $scope.searchFilter3 = function (result) {
    //
    //   return (result.type.toString() === 'deviceRequest' && result.status.toString() === 'accepted');
    // };
    //
    // $scope.searchFilter4 = function (result) {
    //
    //   return (result.type.toString() === 'friendRequest' && result.status.toString() === 'accepted');
    // };
    //
    // $scope.searchFilter5 = function (result) {
    //
    //   return (result.type.toString() === 'deviceRequest' && result.status.toString() === 'rejected');
    // };
    //
    // $scope.searchFilter6 = function (result) {
    //
    //   return (result.type.toString() === 'friendRequest' && result.status.toString() === 'rejected');
    // };


  }
);
