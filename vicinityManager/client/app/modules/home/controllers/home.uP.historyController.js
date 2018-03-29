'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('uPhistoryController',
function ($scope, $stateParams, commonHelpers, auditAPIService, Notification) {

    // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    $scope.loadedPage = false;
    $scope.noLogs = true;
    $scope.dates = [];
    $scope.logs = [];

    // ====== Sets from which date we retrieve notifications at init =====

    $scope.dateFrom =  moment().subtract(7, 'days'); // Initialized to one week ago
    $scope.period = 'week';

    init();
    function init(){
      $scope.loadedPage = false;
      $scope.dates = [];
      $scope.logs = [];
      auditAPIService.getAll($stateParams.userAccountId, 'user', $scope.dateFrom)
      .then(
        function(response){
          var myAudits = getAudits(response.data.message.hasAudits);
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

    function getAudits(array){
      var newArray = [];
      angular.forEach(array,
        function(n) { newArray.push(n.id); }
      );
      return newArray;
    }

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

  });
