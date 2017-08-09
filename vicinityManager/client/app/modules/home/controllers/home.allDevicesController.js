'use strict';
angular.module('VicinityManagerApp.controllers')
.filter('customAllDevs',
 function() {
  return function(input, searchTerm) {

    var out = [];
    var keyword = new RegExp(searchTerm, "i");

    angular.forEach(input,
      function(device) {
       if (keyword.test(device.name)) {
          out.push(device);
       }
      }
    );
    return out;
  };
})
.controller('allDevicesController',
   function ($scope, $window, $interval, itemsAPIService, Notification){

// ====== Trigger for the first time window resize to avoid bug =======
    $(window).trigger('resize');
      $interval(waitTillLoad, 100, 1);
      function waitTillLoad(){
        $(window).trigger('resize');
      }

  // Initialize variables and get initial data =============

       $scope.devs=[];
       $scope.onlyPrivateDevices = false;
       $scope.note="Access for friends";
       $scope.noItems = true;
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.tempId = "";
       $scope.offset = 0;
       $scope.allItemsLoaded = false;

       init();

       function init(){
          itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, "device", $scope.offset)
          .then(
            function successCallback(response){
              for(var i = 0; i < response.data.message.length; i++){
                  $scope.devs.push(response.data.message[i]);
              }

              $scope.noItems = (response.data.message.length === 0);
              $scope.allItemsLoaded = response.data.message.length < 12;

              var j = 0;
              for (var dev in $scope.devs){
                if ($scope.devs[dev].accessLevel > 1){
                  j++;
                }
              }
              if (j === 0){
                $scope.onlyPrivateDevices = true;
              }else{
                $scope.onlyPrivateDevices = false;
              }
              $scope.loaded = true;
              $scope.loadedPage = true;
            },
             errorCallback
          );
        }

// Manage access request functions =====================

   $scope.processMyAccess = function(dev_id) {
     $scope.tempId = dev_id;
     itemsAPIService.processItemAccess(dev_id)
     .then(processingAccess,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyRequest = function(dev_id) {
     $scope.tempId = dev_id;
     itemsAPIService.cancelItemRequest(dev_id)
     .then(cancellingRequest,errorCallback)
     .then(getItem,errorCallback);
    };

   $scope.cancelMyAccess = function(dev_id) {
     $scope.tempId = dev_id;
     $scope.note = "";
     itemsAPIService.cancelItemAccess(dev_id)
     .then(cancellingAccess,errorCallback)
     .then(getItem,errorCallback);
   };

// Callbacks and helpers ===============

   function processingAccess(response){
     if (response.data.message.error) {
         Notification.error("Sending data access request failed!");
     } else {
         Notification.success("Access request sent!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function cancellingRequest(response){
     if (response.data.message.error) {
         Notification.error("Sending data access request failed!");
     } else {
         Notification.success("Data access request canceled!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function cancellingAccess(response){
     if (response.data.message.error) {
         Notification.error("Try for interruption failed!");
     } else {
         Notification.success("Connection interrupted!");
     }
     return itemsAPIService.getItemWithAdd($scope.tempId);
   }

   function getItem(response){
     updateScopeAttributes(response);
     $scope.tempId = "";
   }

  function errorCallback(err){
    Notification.error("Something went wrong: " + err);
  }

  function updateScopeAttributes(response){
    for (var dev in $scope.devs){
      if ($scope.devs[dev]._id.toString() === response.data.message[0]._id.toString()){
          $scope.devs[dev] = response.data.message[0];
      }
    }
  }

  // Trigers load of more items

  $scope.loadMore = function(){
      $scope.loaded = false;
      $scope.offset += 12;
      init();
  };

  // Detects if end of the scroll and loads more items (24 at a time)

  // $(window).scroll(
  //   function() {
  //     if( ( $(window).scrollTop() + $(window).height() === $(document).height() ) && !$scope.allItemsLoaded) {
  //       $scope.loaded = false;
  //       $scope.offset += 24;
  //       disableScroll(); // disables all scroll event triggers while loading new items
  //       init();
  //     }
  //   }
  // );


  // Handling enable/disable scroll

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
// var keys = {37: 1, 38: 1, 39: 1, 40: 1};
//
// function preventDefault(e) {
//   e = e || window.event;
//   if (e.preventDefault)
//       e.preventDefault();
//   e.returnValue = false;
// }
//
// function preventDefaultForScrollKeys(e) {
//     if (keys[e.keyCode]) {
//         preventDefault(e);
//         return false;
//     }
// }
//
// function disableScroll() {
//   if (window.addEventListener){ // older FF
//       window.addEventListener('DOMMouseScroll', preventDefault, false);
//   }
//   window.onwheel = preventDefault; // modern standard
//   window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
//   window.ontouchmove  = preventDefault; // mobile
//   document.onkeydown  = preventDefaultForScrollKeys;
// }
//
// function enableScroll() {
//     if (window.removeEventListener){
//         window.removeEventListener('DOMMouseScroll', preventDefault, false);
//     }
//     window.onmousewheel = document.onmousewheel = null;
//     window.onwheel = null;
//     window.ontouchmove = null;
//     document.onkeydown = null;
// }

});
