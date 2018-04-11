'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('nodeAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var nodeAPI = {};

  nodeAPI.getAll = function(cid) {
    return $http.get(configuration.apiUrl + '/nodes/' + cid);
  };

  nodeAPI.getOne = function(id) {
    return $http.get(configuration.apiUrl + '/nodes/node/' + id);
  };

  nodeAPI.postOne = function(data) {
    return $http.post(configuration.apiUrl + '/nodes/', data);
  };

  nodeAPI.pullIdFromOrganisation = function(cid,data) {
    return $http.put(configuration.apiUrl + '/nodes/node/' + cid, data);
  };

  nodeAPI.updateOne = function(adid,data) {
    return $http.put(configuration.apiUrl + '/nodes/' + adid, data);
  };

  return nodeAPI;
}]);
