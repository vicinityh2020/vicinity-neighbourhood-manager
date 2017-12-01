'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cPhistoryController',
function ($scope, $stateParams, commonHelpers, auditAPIService, Notification) {

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    $scope.loadedPage = false;
    $scope.noLogs = true;
    $scope.dates = [];
    $scope.logs = [];

    init();
    function init(){
      auditAPIService.getAll($stateParams.companyAccountId)
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
