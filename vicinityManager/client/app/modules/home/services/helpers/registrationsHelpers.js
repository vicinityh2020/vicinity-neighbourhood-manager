/*
Functions shared accross controllers in the HOME modules.
Functions related with items (services, devices).
*/
'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('registrationsHelpers', ['Notification', 'registrationsAPIService',
  function(Notification, registrationsAPIService){

    var helpers = {};

     /*
     Accepts organisation registration request
     */
     helpers.acceptRegistration = function(reg_id){
       return registrationsAPIService.putOne(reg_id, {status: "pending" })
         .then(function successCallback(response){
           if (response.error) {
             Notification.error("Registration process failed...");
           } else {
              Notification.success("Verification mail was sent to the company!");
           }
          })
         .catch(helpers.errorCallback);
       };

     /*
     Rejects organisation registration request
     */
     helpers.rejectRegistration = function(reg_id){
       return registrationsAPIService.putOne(reg_id, {status: "declined" })
         .then(function successCallback(response){
           if (response.error) {
             Notification.error("Registration process failed...");
           } else {
             Notification.success("Company was rejected!");
           }
         })
        .catch(helpers.errorCallback);
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
