'use strict';

angular.module('VicinityManagerApp.controllers')
.controller('dPhistoryController',
function ($scope, $window, commonHelpers, $stateParams, auditAPIService, Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.loadedPage = false;
  $scope.noLogs = true;
  $scope.dates = [];
  $scope.logs = [];

  init();
  function init(){
    auditAPIService.getAll($stateParams.deviceId)
    .then(
      function(response){
        var myAudits = response.data.message.data;
        commonHelpers.addTimestamp(myAudits, function(array, dates){
          $scope.dates = dates;
          $scope.logs = array;
          $scope.noLogs = array.length !== 0 ? false : true;
          $scope.loadedPage = true;
        });
        $scope.logs.reverse();
      })
      .catch(
        function(error){
          Notification.error("Something went wrong: " + error);
        }
      );
  }

});
