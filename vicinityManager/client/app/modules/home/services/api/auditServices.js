'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('auditAPIService', ['$http', 'configuration', function($http, configuration){

  var auditAPI = {};

  auditAPI.getAll = function(id, type, searchDate) {
    return $http.get(configuration.apiUrl + '/audit/' + id + '?type=' + type + '&searchDate=' + searchDate);
  };

  return auditAPI;
}]);
