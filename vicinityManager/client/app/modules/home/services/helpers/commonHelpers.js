/*
Functions shared accross controllers in the HOME modules.
Common functions not focus on any concrete part of the app.
*/
'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('commonHelpers', ['$interval', 'Notification', '$window',
  function($interval, Notification, $window){

  var helpers = {};

/*
Triggers resize on page load.
Needed to overcome sidebar length bar.
Used in almost all controllers.
Also ensures that when there is a change of
url/state, the view is displayed at the top position
*/
  helpers.triggerResize = function() {
    $(window).trigger('resize');
      $interval(waitTillLoad, 100, 1);
      function waitTillLoad(){
        $(window).trigger('resize');
      }
    $window.scrollTo(0, 0);
  };

  /*
  Error Callback handler
  */
  helpers.errorCallback = function(err){
    Notification.error("Something went wrong: " + JSON.stringify(err));
  };

/*
Handling enable/disable scroll
*/
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

// Return service for external use
  return helpers;

  }
]);
