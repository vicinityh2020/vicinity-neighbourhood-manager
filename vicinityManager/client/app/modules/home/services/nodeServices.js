'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('nodeAPIService', ['$http', 'configuration', function($http, configuration){

  var nodeAPI = {};

  nodeAPI.getAll = function(cid) {
    return $http.get(configuration.apiUrl + '/nodes/' + cid);
  };

  nodeAPI.getOne = function(id) {
    return $http.get(configuration.apiUrl + '/nodes/node/' + id);
  };

  nodeAPI.postOne = function(cid,data) {
    return $http.post(configuration.apiUrl + '/nodes/' + cid, data);
  };

  nodeAPI.deleteOne = function(cid,data) {
    return $http.put(configuration.apiUrl + '/nodes/node/' + cid, data);
  };

  nodeAPI.updateOne = function(cid,data) {
    return $http.put(configuration.apiUrl + '/nodes/' + cid, data);
  };

  // nodeAPI.postResource = function(endPoint, data) {
  //   return $http.post(configuration.apiUrl + '/commServer/' + endPoint, data);
  // };
  //
  // nodeAPI.putResource = function(endPoint, data) {
  //   return $http.put(configuration.apiUrl + '/commServer/' + endPoint, data);
  // };
  //
  // nodeAPI.deleteResource = function(endPoint, data) {
  //   return $http.post(configuration.apiUrl + '/commServer/delete/' + endPoint, data);
  // };

  // nodeAPI.getResource = function(id) {
  //   return $http.get(configuration.apiUrl + '/commServer/' + id);
  // };

  return nodeAPI;
}]);
