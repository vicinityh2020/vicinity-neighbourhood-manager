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
  };

  /*
  Error Callback handler
  */
  helpers.errorCallback = function(err){
    Notification.error("Something went wrong: " + JSON.stringify(err));
  };

/*
Converts Mongo Id into timestamp so we can work with dates in the UI
*/

  helpers.addTimestamp = function(array, callback){
    var t = [], aux = [], result = [], dates = [];
    angular.forEach(array,
      function(n) {
        if(n){
          var timestamp = n._id.toString().substring(0,8);
          var date = new Date(parseInt( timestamp, 16 ) * 1000 );
          n.timestamp = moment(date);
          n.dateCaption = n.timestamp.format("Do MMM YYYY");
          n.timeCaption = n.timestamp.format("hh:mm a");
          t.push(n.timestamp);
          result.push(n);
        }
      }
    );
    t.sort(function(a,b){
      return b - a;
    });
    angular.forEach(t,
    function(n){
        aux = n.format("Do MMM YYYY");
        if (dates.indexOf(aux) === -1){
          dates.push(aux);
        }
      }
    );
    callback(result, dates);
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
