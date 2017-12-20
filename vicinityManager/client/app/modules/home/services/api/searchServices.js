'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('searchAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var searchAPI = {};

  searchAPI.getSubclass = function(filter) {
    return $http.get(configuration.apiUrl + '/search/subclass?searchTerm=' + filter );
  };

  searchAPI.getAllSubclass = function(filter) {
    return $http.get(configuration.apiUrl + '/search/allSubclass?searchTerm=' + filter );
  };

  searchAPI.getOids = function(filter, predicate, getGraph) {
    var obj = {searchTerm: filter, predicate: predicate, getGraph: getGraph};
    return $http.post(configuration.apiUrl + '/search/getOids', obj);
  };

  searchAPI.searchOrganisation = function(filter) {
    return $http.get(configuration.apiUrl + '/search/organisation?searchTerm=' + filter );
  };

  searchAPI.searchUser = function(filter) {
    var cid = $window.sessionStorage.companyAccountId.toString();
    return $http.get(configuration.apiUrl + '/search/user?searchTerm=' + filter + '&cid=' + cid);
  };

  searchAPI.searchItem = function(cid, filter, data) {
    return $http.post(configuration.apiUrl + '/search/item/' + cid + '?searchTerm=' + filter, data );
  };

  return searchAPI;

}]);
