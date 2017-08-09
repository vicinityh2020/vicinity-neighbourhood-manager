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

    $(window).trigger('resize');

    $scope.items=[];
    $scope.tempId = "";
    $scope.loaded = false;
    $scope.loadedPage = false;
    $scope.noItems = true;
    $scope.filterTerm = "0";
    $scope.offset = 0;
    $scope.allItemsLoaded = false;

    init();

    function init(){
    itemsAPIService.getMyItems($window.sessionStorage.companyAccountId, 'service')
      .then(
        function successCallback(response) {
            for(var i = 0; i < response.data.message.length; i++){
                $scope.items.push(response.data.message[i]);
            }
           $scope.allItemsLoaded = response.data.message.length < 12;
           $scope.noItems = ($scope.items.length === 0);
           $scope.loaded = true;
           $scope.loadedPage = true;
         },
         errorCallback
       );
     }

     function errorCallback(err){
       Notification.error("Something went wrong: " + err);
     }

     // Trigers load of more items

     $scope.loadMore = function(){
         $scope.loaded = false;
         $scope.offset += 12;
         init();
     };

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
