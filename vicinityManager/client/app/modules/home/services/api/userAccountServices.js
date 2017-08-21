'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', ['$http', 'configuration', function($http, configuration){

  var userAccountAPI = {};

  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id);
  };

  userAccountAPI.getUserAccounts = function(){
    return $http.get(configuration.apiUrl +'/useraccounts');
  };

  userAccountAPI.updateUserAccounts = function(id,data){
    return $http.put(configuration.apiUrl +'/useraccounts/' + id, data);
  };

  userAccountAPI.sendNeighbourRequest = function (id) {
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.acceptNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/accept');
  };

  userAccountAPI.rejectNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/reject');
  };

  userAccountAPI.cancelNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/cancel');
  };

  userAccountAPI.cancelNeighbourship = function(id) {
    return $http.delete(configuration.apiUrl +'/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.getFriends = function(id) {
    return $http.get(configuration.apiUrl + '/useraccounts/' + id + '/friendship/myFriends');
  };

  userAccountAPI.getNotificationsOfUser = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/notifications');
  };

  userAccountAPI.getNotificationsOfUserRead = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/readNotifications');
  };

  // Configuration endPoints (currently only schemaColor)

  userAccountAPI.getConfigurationParameters = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/configuration');
  };

  userAccountAPI.putConfigurationParameters = function(id, data) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/configuration', data);
  };

  return userAccountAPI;

}]);
