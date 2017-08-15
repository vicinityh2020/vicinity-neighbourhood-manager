/*
Functions shared accross controllers in the HOME modules.
Functions related with items (services, devices).
*/
'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('userAccountsHelpers', ['Notification', 'userAccountAPIService',
  function(Notification, userAccountAPIService){

    var helpers = {};

     /*
     Accepts organisation friendship request
     */
     helpers.acceptNeighbourRequest = function(friendId){
       return userAccountAPIService.acceptNeighbourRequest(friendId)
           .then(
             function successCallback(response){
               if (response.error) {
                   Notification.error("Partnership request acceptation failed :(");
               } else {
                   Notification.success("Partnership request accepted!");
               }
           },
           helpers.errorCallback
         );
       };

     /*
     Rejects organisation friendship request
     */
     helpers.rejectNeighbourRequest = function(friendId){
       return userAccountAPIService.rejectNeighbourRequest(friendId)
           .then(
             function successCallback(response){
               if (response.error) {
                   Notification.error("Partnership request acceptation failed :(");
               } else {
                   Notification.success("Partnership request rejected!");
               }
           },
           helpers.errorCallback
         );
       };

    /*
    Error Callback handler
    */
    helpers.errorCallback = function(err){
      Notification.error("Something went wrong: " + err);
    };

    return helpers;

  }
]);
