"use strict";
var services = angular.module('VicinityManagerApp.services').
factory('notificationsAPIService', ['$http', 'configuration', function($http, configuration){

  var notificationsAPI = {};

  notificationsAPI.getNotifications = function(all, searchDate) {
    if(all){
      return $http.get(configuration.apiUrl + '/notifications?all=' + all + '&searchDate=' + searchDate);
    } else {
      return $http.get(configuration.apiUrl + '/notifications/');
    }
  };

  notificationsAPI.changeIsUnreadToFalse = function(id, data) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeIsUnreadToFalse', data);
  };

  notificationsAPI.changeStatusToResponded = function(id,status) {
    return $http.put(configuration.apiUrl + '/notifications/' + id + '/changeStatusToResponded' + '?status=' + status);
  };

  return notificationsAPI;

}]);
