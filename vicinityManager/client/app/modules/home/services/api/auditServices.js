'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('auditAPIService', ['$http', 'configuration', function($http, configuration){

  var auditAPI = {};

  auditAPI.getAll = function(id) {
    return $http.get(configuration.apiUrl + '/audit/' + id);
  };

  return auditAPI;
}]);
