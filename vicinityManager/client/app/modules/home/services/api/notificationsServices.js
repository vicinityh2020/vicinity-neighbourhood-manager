"use strict";
var services = angular.module('VicinityManagerApp.services').
factory('notificationsAPIService', ['$http', 'configuration', function($http, configuration){

  var notificationsAPI = {};

  notificationsAPI.getNotifications = function(limit, offset, pending) {
    return $http.get(configuration.apiUrl + '/notifications?limit=' + limit + '&offset=' + offset + '&pending=' + pending);
  };

  notificationsAPI.refreshNotifications = function() {
    return $http.get(configuration.apiUrl + '/notifications/refresh');
  };

  notificationsAPI.changeIsUnreadToFalse = function(id, data) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeIsUnreadToFalse', data);
  };

  notificationsAPI.changeStatusToResponded = function(id,status) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeStatusToResponded' + '?status=' + status);
  };

  return notificationsAPI;

}]);
