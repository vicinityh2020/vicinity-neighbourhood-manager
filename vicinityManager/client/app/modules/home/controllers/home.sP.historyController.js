'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('sPhistoryController',
function ($scope, $stateParams, commonHelpers, auditAPIService, Notification) {

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    $scope.loadedPage = false;
    $scope.dates = [];
    $scope.logs = [];

    init();
    function init(){
      auditAPIService.getAll($stateParams.serviceId)
      .then(
        function(response){
          var myAudits = response.data.message.data;
          commonHelpers.addTimestamp(myAudits, function(array, dates){
            $scope.dates = dates;
            $scope.logs = array;
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
