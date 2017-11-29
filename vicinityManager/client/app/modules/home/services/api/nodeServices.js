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

  nodeAPI.postOne = function(cid,data) {
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl + '/nodes/' + cid, data);
  };

  nodeAPI.pullIdFromOrganisation = function(cid,data) {
    return $http.put(configuration.apiUrl + '/nodes/node/' + cid, data);
  };

  nodeAPI.updateOne = function(cid,data) {
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl + '/nodes/' + cid, data);
  };

  return nodeAPI;
}]);
