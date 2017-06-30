'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('searchAPIService', ['$http', 'configuration', function($http, configuration){

  var searchAPI = {};

  //simple search filter
  // searchAPI.search = function(filter) {
  //   return $http.get('http://localhost:3000/search?filter=' + filter);
  // };

  searchAPI.searchOrganisation = function(filter) {
    return $http.get(configuration.apiUrl + '/search/organisation?searchTerm=' + filter );
  };

  searchAPI.searchUser = function(filter) {
    return $http.get(configuration.apiUrl + '/search/user?searchTerm=' + filter );
  };

  searchAPI.searchItem = function(cid, filter, data) {
    return $http.post(configuration.apiUrl + '/search/item/' + cid + '?searchTerm=' + filter, data );
  };

  return searchAPI;

}]);
