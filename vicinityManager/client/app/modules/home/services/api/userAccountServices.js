'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', ['$http', 'configuration', function($http, configuration){

  var userAccountAPI = {};

  // Main calls - retrieving userAccounts

  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id);
  };

  userAccountAPI.updateUserAccounts = function(id,data){
    return $http.put(configuration.apiUrl +'/useraccounts/' + id, data);
  };

  userAccountAPI.getUserAccounts = function(id, filter){
    return $http.get(configuration.apiUrl + '/useraccounts/' + id + '/organisations?type=' + filter);
  };

  // userAccountAPI.getFriends = function(id) {
  //   return $http.get(configuration.apiUrl + '/useraccounts/' + id + '/friendship/myFriends');
  // };

  // Neigbourhood management

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

  // Notification calls

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

  userAccountAPI.removeOrganisation = function(id) {
    return $http.delete(configuration.apiUrl +'/useraccounts/' + id + '/remove');
  };

  return userAccountAPI;

}]);
