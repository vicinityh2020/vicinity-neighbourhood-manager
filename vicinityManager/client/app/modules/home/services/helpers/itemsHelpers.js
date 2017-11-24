/*
Functions shared accross controllers in the HOME modules.
Functions related with items (services, devices).
*/
'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('itemsHelpers', ['Notification', 'itemsAPIService',
  function(Notification, itemsAPIService){

    var helpers = {};

    /*
    Processes data access request to item
    */
     helpers.processingAccess = function(response){
       if (response.data.message.error) {
           Notification.error("Sending data access request failed!");
       } else {
           Notification.success("Access request sent!");
       }
       return itemsAPIService.getItemWithAdd(response.data.message._id);
     };

     /*
     Cancels data access request to item
     */
     helpers.cancellingRequest = function(response){
       if (response.data.message.error) {
           Notification.error("Sending data access request failed!");
       } else {
           Notification.success("Data access request canceled!");
       }
       return itemsAPIService.getItemWithAdd(response.data.message._id);
     };

     /*
     Cancels the access to some item of other company (access must be prior granted)
     */
     helpers.cancellingAccess = function(response){
       if (response.data.message.error) {
           Notification.error("Try for interruption failed!");
       } else {
           Notification.success("Connection interrupted!");
       }
       return itemsAPIService.getItemWithAdd(response.data.message._id);
     };

     /*
     Accepts organisation data request
     */
     helpers.acceptDataRequest = function(dev_id, notifId){
       return itemsAPIService.acceptItemRequest(dev_id)
         .then(
           function successCallback(response) {
             if (response.error) {
                 Notification.error("Sending data access request failed!");
             } else {
                 Notification.success("Data access approved!");
             }
           },
           helpers.errorCallback
         );
       };

     /*
     Rejects organisation data request
     */
     helpers.rejectDataRequest = function(dev_id, notifId){
       return itemsAPIService.rejectItemRequest(dev_id)
         .then(
           function successCallback(response) {
           if (response.error) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Data access rejected!");
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
