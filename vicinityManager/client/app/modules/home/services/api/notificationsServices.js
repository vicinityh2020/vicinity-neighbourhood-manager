"use strict";
var services = angular.module('VicinityManagerApp.services').
factory('notificationsAPIService', ['$http', 'configuration', function($http, configuration){

  var notificationsAPI = {};

  notificationsAPI.getNotificationsOfUser = function(id) {
    return $http.get(configuration.apiUrl + '/notifications/' + id + '/userNotifications');
  };

  notificationsAPI.getNotificationsOfRegistration = function() {
    return $http.get(configuration.apiUrl + '/notifications/registrations');
  };

  notificationsAPI.getAllUserNotifications = function(id, filter) {
    return $http.get(configuration.apiUrl + '/notifications/' + id + '/allUserNotifications' + '?searchDate=' + filter);
  };

  notificationsAPI.getAllRegistrations = function(filter) {
    return $http.get(configuration.apiUrl + '/notifications/allRegistrations' + '?searchDate=' + filter);
  };

  notificationsAPI.changeIsUnreadToFalse = function(id, data) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeIsUnreadToFalse', data);
  };

  notificationsAPI.changeStatusToResponded = function(id,status) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeStatusToResponded' + '?status=' + status);
  };

  return notificationsAPI;

}]);
