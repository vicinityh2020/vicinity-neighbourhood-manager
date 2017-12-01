'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('myNotificationsController',
  function ($scope,
            $window,
            commonHelpers,
            notificationsAPIService,
            tokenDecoder,
            registrationsHelpers,
            itemsHelpers,
            userAccountsHelpers) {

// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Ensure scroll on top onLoad
      $window.scrollTo(0, 0);

// ======= Set initial variables ==========
  $scope.loadedPage = false;
  $scope.rev = true;
  $scope.myOrderBy = 'date';
  $scope.notifs = [];
  $scope.notifsWithDate = [];
  $scope.tempNotifs = [];

// ====== Checking if user is devOps =============
$scope.isDev = false;
var payload = tokenDecoder.deToken();
var keyword = new RegExp('devOps');
$scope.isDev = keyword.test(payload.roles);

// ====== Sets from which date we retrieve notifications at init =====

$scope.dateFrom =  moment().subtract(7, 'days'); // Initialized to one week ago
$scope.period = 'week';

// ====== Getting notifications ======

  init();

  function init(){
    $scope.loadedPage = false;
    $scope.dates = [];
    $scope.notifsWithDate = [];
    notificationsAPIService.getAllUserNotifications($window.sessionStorage.companyAccountId, $scope.dateFrom)
    .then(getNotifs, commonHelpers.errorCallback);
  }

  function getNotifs(response){
      $scope.tempNotifs = response.data.message;
      if($scope.isDev){
        notificationsAPIService.getAllRegistrations($scope.dateFrom)
        .then(
          function successCallback(response){
            for(var index in response.data.message){
              $scope.notifs = $scope.tempNotifs.concat(response.data.message);
            }
            commonHelpers.addTimestamp($scope.notifs, function(array, dates){
              $scope.dates = dates;
              $scope.notifsWithDate = array;
              $scope.loadedPage = true;
            });
          },
          commonHelpers.errorCallback
        );
      }else{
        $scope.notifs = $scope.tempNotifs;
        commonHelpers.addTimestamp($scope.notifs, function(array, dates){
          $scope.dates = dates;
          $scope.notifsWithDate = array;
          $scope.loadedPage = true;
        });
      }
    }

// --------------------------------------------------

    $scope.notificationsDays = function(period){
      $scope.period = period;
      switch(period){
        case 'today':
          $scope.dateFrom =  moment().endOf('day').subtract(1, 'days');
          break;
        case 'week':
          $scope.dateFrom =  moment().endOf('day').subtract(7, 'days');
          break;
        case 'month':
          $scope.dateFrom =  moment().endOf('day').subtract(1, 'months');
          break;
        case 'year':
          $scope.dateFrom =  moment().endOf('day').subtract(1, 'years');
          break;
      }
      init();
    };

// ========= Accept / Reject requests ==========

  $scope.acceptNeighbourRequest = function (notifId, friendId){
    userAccountsHelpers.acceptNeighbourRequest(friendId)
    .then(init, userAccountsHelpers.errorCallback)
    .catch(userAccountsHelpers.errorCallback);
  };

  $scope.rejectNeighbourRequest = function(notifId, friendId) {
    userAccountsHelpers.rejectNeighbourRequest(friendId)
    .then(init,userAccountsHelpers.errorCallback)
    .catch(userAccountsHelpers.errorCallback);
  };

  $scope.acceptDataRequest = function (dev_id, notifId) {
    itemsHelpers.acceptDataRequest(dev_id, notifId)
    .then(init,itemsHelpers.errorCallback)
    .catch(itemsHelpers.errorCallback);
  };

  $scope.rejectDataRequest = function (dev_id, notifId) {
    itemsHelpers.rejectDataRequest(dev_id, notifId)
    .then(init,itemsHelpers.errorCallback)
    .catch(itemsHelpers.errorCallback);
  };

  $scope.acceptRegistration = function (reg_id, notifId) {
   registrationsHelpers.acceptRegistration(reg_id)
    .then(init,registrationsHelpers.errorCallback)
    .catch(registrationsHelpers.errorCallback);
  };


  $scope.rejectRegistration = function (reg_id, notifId) {
    registrationsHelpers.rejectRegistration(reg_id)
      .then(init,registrationsHelpers.errorCallback)
      .catch(registrationsHelpers.errorCallback);
  };

  // ==== Sorting ====

  $scope.orderByMe = function(x) {
    if($scope.myOrderBy === x){
      $scope.rev=!($scope.rev);
    }
      $scope.myOrderBy = x;
  };

  $scope.onSort = function(order){
    $scope.rev = order;
  };

});
