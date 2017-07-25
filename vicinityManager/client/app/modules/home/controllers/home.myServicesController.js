'use strict';
angular.module('VicinityManagerApp.controllers')
.filter('customMyServs',
 function() {
  return function(input, filterTerm) {

    var out = [];

    angular.forEach(input,
      function(item) {
        var key = new RegExp(item.accessLevel, "i");
        if(filterTerm !== "0"){
          if (key.test(filterTerm)) {
            out.push(item);
          }
        } else {
          out.push(item);
        }
      }
    );
    return out;
  };
})
.controller('myServicesController',
    function ( $scope,
               $window,
               $stateParams,
               itemsAPIService,
               Notification){

// Initialize variables and retrieve initial data -----------------

    $scope.items=[];
    $scope.tempId = "";
    $scope.loaded = false;
    $scope.noItems = true;
    $scope.filterTerm = "0";

    itemsAPIService.getMyItems($window.sessionStorage.companyAccountId, 'service')
      .then(
        function successCallback(response) {
           $scope.items = response.data.message;

           if ($scope.items.length === 0){
             $scope.noitems = true;
           }else{
             $scope.noitems = false;
           }

           $scope.loaded = true;
         },
         function errorCallback(response){
         }
       );

// Different views (Dropdown) --------------------------------------

    $scope.allItems = function () {
      $scope.filterTerm = "0";
    };

    $scope.privateItems = function () {
      $scope.filterTerm = "1";
    };

    $scope.friendItems = function () {
      $scope.filterTerm = "234";
    };

    $scope.publicItems = function () {
      $scope.filterTerm = "5678";
    };

});
