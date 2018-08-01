'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var userAccountAPI = {};

  // Main calls - retrieving userAccounts

  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id);
  };

  userAccountAPI.getUserAccountCid = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/cid');
  };

  userAccountAPI.updateUserAccounts = function(id,data){
    return $http.put(configuration.apiUrl +'/useraccounts/' + id, data);
  };

  userAccountAPI.getUserAccounts = function(id, filter, offset){
    return $http.get(configuration.apiUrl + '/useraccounts/' + id + '/organisations?type=' + filter + '&offset=' + offset);
  };

  // Neigbourhood management

  userAccountAPI.sendNeighbourRequest = function (id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship/request', data);
  };

  userAccountAPI.acceptNeighbourRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship/accept', data);
  };

  userAccountAPI.rejectNeighbourRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship/reject', data);
  };

  userAccountAPI.cancelNeighbourRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship/cancelRequest', data);
  };

  userAccountAPI.cancelNeighbourship = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship/cancel', data);
  };

  // Notification calls

  // Configuration endPoints (currently only schemaColor)

  userAccountAPI.getConfigurationParameters = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/configuration');
  };

  userAccountAPI.putConfigurationParameters = function(id, data) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/configuration', data);
  };

  userAccountAPI.removeOrganisation = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/remove', data);
  };

  return userAccountAPI;

}]);
