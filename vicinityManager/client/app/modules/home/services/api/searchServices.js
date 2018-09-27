'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('searchAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var searchAPI = {};

  searchAPI.searchOrganisation = function(filter) {
    return $http.get(configuration.apiUrl + '/search/organisation?searchTerm=' + filter );
  };

  searchAPI.searchUser = function(filter) {
    return $http.get(configuration.apiUrl + '/search/user?searchTerm=' + filter);
  };

  searchAPI.searchItem = function(filter) {
    return $http.get(configuration.apiUrl + '/search/item/?searchTerm=' + filter);
  };

  searchAPI.getOntologyTypes = function() {
    return $http.get(configuration.apiUrl + '/search/ontology');
  };

  return searchAPI;

}]);
