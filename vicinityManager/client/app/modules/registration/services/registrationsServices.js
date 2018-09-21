"use strict";
var services = angular.module('VicinityManagerApp.services').
factory('registrationsAPIService', ['$http', 'configuration', function($http, configuration){

  var registrationsAPI = {};

  registrationsAPI.getOne = function(id){
    return $http.get(configuration.apiUrl +'/registrations/' + id );
  };

  registrationsAPI.getAll = function(){
    return $http.get(configuration.apiUrl +'/registrations/');
  };

  registrationsAPI.postOne = function(data) {
    return $http.post(configuration.apiUrl +'/registrations/', data);
  };

  registrationsAPI.putOne = function(id, data) {
    return $http.put(configuration.apiUrl +'/registrations/' + id, data);
  };

  registrationsAPI.findDuplicatesUser = function(data) {
    return $http.post(configuration.apiUrl +'/registrations/duplicatesUser', data);
  };

  registrationsAPI.findDuplicatesCompany = function(data) {
    return $http.post(configuration.apiUrl +'/registrations/duplicatesCompany', data);
  };

  registrationsAPI.findDuplicatesRegMail = function(data) {
    return $http.post(configuration.apiUrl +'/registrations/duplicatesRegMail', data);
  };

  return registrationsAPI;
}]);
