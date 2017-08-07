"use strict";
var services = angular.module('VicinityManagerApp.services').
factory('notificationsAPIService', ['$http', 'configuration', function($http, configuration){

  var notificationsAPI = {};

  notificationsAPI.getAll = function() {
    return $http.get(configuration.apiUrl + '/notifications');
  };

  notificationsAPI.getNotificationsOfRegistration = function() {
    return $http.get(configuration.apiUrl + '/notifications/registrations');
  };

  notificationsAPI.getNotificationsOfRegistrationRead = function() {
    return $http.get(configuration.apiUrl + '/notifications/registrationsRead');
  };

  notificationsAPI.getAllUserNotifications = function(id, filter) {
    return $http.get(configuration.apiUrl + '/notifications/' + id + '/allNotifications' + '?searchDate=' + filter);
  };

  notificationsAPI.getAllRegistrations = function(filter) {
    return $http.get(configuration.apiUrl + '/notifications/allRegistrations' + '?searchDate=' + filter);
  };

  notificationsAPI.changeIsUnreadToFalse = function(id) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeIsUnreadToFalse');
  };

  notificationsAPI.changeStatusToResponded = function(id,answer) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/' + answer + '/changeStatusToResponded');
  };

  notificationsAPI.updateNotificationOfRegistration = function(id) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/updateNotificationOfRegistration');
  };

  return notificationsAPI;

}]);
